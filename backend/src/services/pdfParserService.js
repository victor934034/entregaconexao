const fs = require('fs');
const pdf = require('pdf-parse');

const PATTERNS = {
    numeroPedido: /Número:\s*(\d+)/i,
    dataPedido: /Data:\s*(\d{2}\/\w+\/\d{4}\s+\d{2}:\d{2})/i,
    dataEntrega: /Entr\. início:\s*(\d{2}\/\w+\/\d{4})/i,
    nomeCliente: /Nome:\s*(.+?)(?:\s*\/\s*Fone|\n)/i,
    telefoneCliente: /(?:Fone|Celular):\s*([\d\s\-()]+)/i,
    enderecoEntrega: /Endereço de Entrega:\s*\n([\s\S]+?)(?:\nAprovação|$)/i,
    totalLiquido: /Total Liquido R\$\s*([\d.,]+)/i,
    formaPagamento: /(DINHEIRO|PIX|CARTÃO|CRÉDITO|CREDIÁRIO|CHEQUE)/i,
    vencimento: /\(0\)\s*(\d{2}\/\d{2}\/\d{2})/i,
};

function extractField(text, regex, defaultValue = '') {
    const match = text.match(regex);
    if (match && match[1]) {
        return { value: match[1].trim(), confianca: 'alta' };
    }
    return { value: defaultValue, confianca: 'baixa' };
}

async function parsePedidoPdf(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        const text = data.text;

        const parsedData = {
            numeroPedido: extractField(text, PATTERNS.numeroPedido),
            dataPedido: extractField(text, PATTERNS.dataPedido),
            dataEntrega: extractField(text, PATTERNS.dataEntrega),
            nomeCliente: extractField(text, PATTERNS.nomeCliente),
            telefoneCliente: extractField(text, PATTERNS.telefoneCliente),
            enderecoEntrega: extractField(text, PATTERNS.enderecoEntrega),
            totalLiquido: extractField(text, PATTERNS.totalLiquido),
            formaPagamento: extractField(text, PATTERNS.formaPagamento),
            vencimento: extractField(text, PATTERNS.vencimento),
            itens: [], // The table parsing can be improved below
            rawText: text // Keep for debugging if needed
        };

        // Helper block to parse items (basic attempt)
        const itemsSectionMatch = text.match(/ITENS DO PEDIDO(?:\s|\n)+([\s\S]*?)(?:Totalizadores|Totais)/i);
        if (itemsSectionMatch && itemsSectionMatch[1]) {
            const itemsLines = itemsSectionMatch[1].split('\n').filter(line => line.trim().length > 0);

            // Each line: [num] [codigo] [descricao] [qtd] [un] [desc%] [unit] [total]
            // Highly dependent on actual PDF structure.
            itemsLines.forEach(line => {
                // Just a mock parsing for standard lines:
                const parts = line.split(/\s+/);
                if (parts.length >= 6) {
                    parsedData.itens.push({
                        codigo: parts[1],
                        descricao: parts.slice(2, -4).join(' '),
                        quantidade: parts[parts.length - 4],
                        unidade: parts[parts.length - 3],
                        valor_unitario: parts[parts.length - 2],
                        valor_total: parts[parts.length - 1],
                        confianca: 'media'
                    });
                }
            });
        } else {
            parsedData.itens.push({ descricao: '', quantidade: 1, confianca: 'baixa' });
        }

        return parsedData;

    } catch (error) {
        console.error('Erro ao fazer parse do PDF:', error);
        throw new Error('Falha no processamento do arquivo PDF.');
    }
}

module.exports = {
    parsePedidoPdf
};
