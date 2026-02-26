const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

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
    if (!text) return { value: defaultValue, confianca: 'baixa' };
    const match = text.match(regex);
    if (match && match[1]) {
        return { value: match[1].trim(), confianca: 'alta' };
    }
    return { value: defaultValue, confianca: 'baixa' };
}

/**
 * Nota: pdf-lib não extrai texto nativamente de forma simples como pdf-parse.
 * Para evitar o erro fatal de ambiente do pdf-parse, usaremos pdf-lib para
 * carregar o documento e um fallback ou futura integração com ferramentas de OCR/Text.
 * Por enquanto, retornaremos um log de aviso para não crashar o servidor.
 */
async function parsePedidoPdf(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfDoc = await PDFDocument.load(dataBuffer);

        console.log(`PDF carregado: ${pdfDoc.getPageCount()} páginas.`);

        // Mock de texto para evitar crash enquanto pdf-lib é configurado para extração
        // ou substituído por uma ferramenta de linha de comando no Docker (ex: pdftotext)
        const text = "ERRO: Extração de texto desativada temporariamente para estabilidade.";

        const parsedData = {
            numeroPedido: { value: '000', confianca: 'baixa' },
            dataPedido: { value: '', confianca: 'baixa' },
            dataEntrega: { value: '', confianca: 'baixa' },
            nomeCliente: { value: 'Aguardando ajuste de Parser', confianca: 'baixa' },
            telefoneCliente: { value: '', confianca: 'baixa' },
            enderecoEntrega: { value: '', confianca: 'baixa' },
            totalLiquido: { value: '0,00', confianca: 'baixa' },
            formaPagamento: { value: '', confianca: 'baixa' },
            vencimento: { value: '', confianca: 'baixa' },
            itens: [],
            rawText: text
        };

        return parsedData;

    } catch (error) {
        console.error('Erro ao processar PDF:', error.message);
        throw new Error('Falha no processamento do arquivo PDF: ' + error.message);
    }
}

module.exports = {
    parsePedidoPdf
};
