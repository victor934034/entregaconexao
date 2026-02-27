const fs = require('fs');
const pdf = require('pdf-parse');

const PATTERNS = {
    numeroPedido: /PEDIDO\s+Nº\s*([\d.]+)/i,
    dataPedido: /Data:\s*(\d{2}\/\w+\/\d{4})/i,
    nomeCliente: /Nome:\s*([\d-]*\s*[^-\n]+)/i,
    enderecoEntrega: /Endereço de Entrega:\s*([\s\S]+?)(?:\nAprovação|$)/i,
    totalLiquido: /Total Liquido R\$\s*([\d.,]+)/i,
};

function extractField(text, regex, defaultValue = '') {
    const match = text.match(regex);
    if (match && match[1]) {
        return { value: match[1].trim(), confianca: 'alta' };
    }
    return { value: defaultValue, confianca: 'baixa' };
}

/**
 * Extrai os itens do pedido com base na estrutura tabular
 */
function extractItems(text) {
    const items = [];
    // Busca a seção de itens entre o cabeçalho e os totalizadores
    const sectionMatch = text.match(/ITENS\s+DO\s+PEDIDO[\s\S]+?Totalizadores/i);

    if (sectionMatch) {
        const section = sectionMatch[0];
        // Regex para capturar cada linha de item:
        // ÍNDICE | DESCRIÇÃO | QTD | UN | ...
        // Ex: 1 RIPA 1X2 CAMBARÁ C/3,0MT 7,00 pç
        const itemRegex = /^(\d+)\s+([\s\S]+?)\s+(\d+[\d,.]*)\s+(\w+)\s+/gm;
        let match;

        while ((match = itemRegex.exec(section)) !== null) {
            items.push({
                id: parseInt(match[1]),
                descricao: match[2].replace(/\n/g, ' ').trim(),
                quantidade: parseFloat(match[3].replace(',', '.')),
                unidade: match[4]
            });
        }
    }
    return items;
}

async function parsePedidoPdf(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        const text = data.text;

        console.log('--- Texto Extraído do PDF ---');
        console.log(text.substring(0, 1000)); // Log para debug no servidor
        console.log('-----------------------------');

        const parsedData = {
            numeroPedido: extractField(text, PATTERNS.numeroPedido, '000'),
            dataPedido: extractField(text, PATTERNS.dataPedido, ''),
            nomeCliente: extractField(text, PATTERNS.nomeCliente, 'Cliente não identificado'),
            enderecoEntrega: extractField(text, PATTERNS.enderecoEntrega, 'Endereço não identificado'),
            totalLiquido: extractField(text, PATTERNS.totalLiquido, '0,00'),
            itens: extractItems(text),
            rawText: text
        };

        // Fallback para endereço se o principal falhar
        if (parsedData.enderecoEntrega.value.includes('Endereço não identificado')) {
            const altEndereco = text.match(/Endereço:\s*(.+?)(?:\nEmail|$)/i);
            if (altEndereco) parsedData.enderecoEntrega.value = altEndereco[1].trim();
        }

        return parsedData;

    } catch (error) {
        console.error('Erro ao processar PDF:', error.message);
        throw new Error('Falha no processamento do arquivo PDF: ' + error.message);
    }
}

module.exports = {
    parsePedidoPdf
};
