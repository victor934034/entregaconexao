const fs = require('fs');
const pdf = require('pdf-parse');

const PATTERNS = {
    numeroPedido: /PEDIDO\s+Nº\s*([\d.]+)/i,
    dataPedido: /Data:(\d{2}\/\w+\/\d{4})/i,
    nomeCliente: /Nome:\s*([\d-]*\s*[^/\n\r]+?)(?:\/|Fone:|$)/i,
    formaPagamento: /Forma Pg\n(?:.*\n){3}([A-ZÀ-Ú\s]+)\n/i,
    vencimento: /\(\d\)(\d{2}\/\d{2}\/\d{2})/i,
    telefone: /CEP:[\d.-]+\s*Fone:\s*([\d\s()-]+?)(?=E-mail|$)/i
};

function extractField(text, regex, defaultValue = '') {
    const match = text.match(regex);
    if (match && match[1]) {
        return { value: match[1].trim(), confianca: 'alta' };
    }
    return { value: defaultValue, confianca: 'baixa' };
}

function extractItems(text) {
    const items = [];
    const lines = text.split('\n');
    lines.forEach(line => {
        // Padrão: Index + Descrição + Qtd + Unidade (pç, M², un, kg, mt, cx, rol, par)
        const itemLineRegex = /^(\d+)\s+(.+?)\s+(\d+[\d,.]*)(pç|M²|un|kg|mt|cx|rol|par)/i;
        const m = line.trim().match(itemLineRegex);
        if (m) {
            items.push({
                id: parseInt(m[1]),
                descricao: m[2].trim(),
                quantidade: parseFloat(m[3].replace(',', '.')),
                unidade: m[4]
            });
        }
    });
    return items;
}

function extractTotalLiquido(text) {
    const lines = text.split('\n');
    const totalIndex = lines.findIndex(l => l.includes('Total Liquido R$'));
    if (totalIndex !== -1 && lines[totalIndex + 1]) {
        const numbers = lines[totalIndex + 1].match(/[\d,.]+/g);
        if (numbers) return { value: numbers[numbers.length - 1], confianca: 'alta' };
    }
    return { value: '0,00', confianca: 'baixa' };
}

async function parsePedidoPdf(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        const text = data.text;

        // LOG CRÍTICO PARA DEBUG EM PRODUÇÃO
        console.log('==== DEBUG PARSE PDF (PRODUÇÃO) ====');
        console.log('TAMANHO DO TEXTO:', text.length);
        console.log('TEXTO BRUTO (JSON):', JSON.stringify(text.substring(0, 500)));
        console.log('====================================');

        const parsedData = {
            numeroPedido: extractField(text, PATTERNS.numeroPedido, '000'),
            dataPedido: extractField(text, PATTERNS.dataPedido, ''),
            nomeCliente: extractField(text, PATTERNS.nomeCliente, 'Cliente não identificado'),
            telefoneCliente: extractField(text, PATTERNS.telefone, ''),
            totalLiquido: extractTotalLiquido(text),
            formaPagamento: extractField(text, PATTERNS.formaPagamento, ''),
            vencimento: extractField(text, PATTERNS.vencimento, ''),
            itens: extractItems(text),
            rawText: text
        };

        // Fallback para endereço
        const enderecoMatch = text.match(/Endereço de Entrega:\s*\n([\s\S]+?)(?:\s+-\s+\n|Aprovação|$)/i);
        parsedData.enderecoEntrega = {
            value: enderecoMatch ? enderecoMatch[1].trim() : 'Endereço não identificado',
            confianca: enderecoMatch ? 'alta' : 'baixa'
        };

        return parsedData;

    } catch (error) {
        console.error('Erro ao processar PDF:', error.message);
        throw new Error('Falha no processamento: ' + error.message);
    }
}

module.exports = {
    parsePedidoPdf
};
