const fs = require('fs');
const pdf = require('pdf-parse');

const PATTERNS = {
    numeroPedido: /PEDIDO\s+Nº\s*([\d.]+)/i,
    dataPedido: /Data:(\d{2}\/\w+\/\d{4})/i,
    nomeCliente: /Nome:\s*(?:\d+[-]\s*)?([^/\n\r\d(]+?)(?:\s+-\s+|\s*[/]|Fone:|$)/i,
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
        const itemLineRegex = /^(\d+)\s+(.+?)\s+(\d+[\d,.]*)(pç|M²|un|kg|mt|cx|rol|par)/i;
        const m = line.trim().match(itemLineRegex);
        if (m) {
            items.push({
                idx: parseInt(m[1]),
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
        // Pega o último número da linha de valores
        const numbers = lines[totalIndex + 1].match(/[\d,.]+/g);
        if (numbers) {
            const val = numbers[numbers.length - 1];
            return { value: val, confianca: 'alta' };
        }
    }
    return { value: '0,00', confianca: 'baixa' };
}

function decomporEndereco(text) {
    const match = text.match(/Endereço de Entrega:\s*\n([\s\S]+?)(?:\s+-\s+\n|Aprovação|$)/i);
    if (!match) return { logradouro: '', numero: '', bairro: '', original: '' };

    const original = match[1].trim();
    // Ex: RUA TOSHIAK SAITO (PRÓX GOES), 400 - CASA 2 - UBERABA
    const parts = original.split('-');

    let logradouro = '';
    let numero = '';
    let bairro = '';

    if (parts.length >= 1) {
        const ruaNum = parts[0].split(',');
        logradouro = ruaNum[0].trim();
        if (ruaNum.length > 1) {
            numero = ruaNum[1].trim();
        }
    }

    if (parts.length >= 2) {
        // Se a parte 2 for um complemento (CASA 2), tenta pegar o bairro na parte 3
        if (parts[1].toUpperCase().includes('CASA') || parts[1].toUpperCase().includes('APTO')) {
            bairro = parts[parts.length - 1].trim();
        } else {
            bairro = parts[1].trim();
        }
    }

    return { logradouro, numero, bairro, original };
}

async function parsePedidoPdf(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        const text = data.text;

        const endereco = decomporEndereco(text);
        const parsedData = {
            numeroPedido: extractField(text, PATTERNS.numeroPedido, '000'),
            dataPedido: extractField(text, PATTERNS.dataPedido, ''),
            nomeCliente: extractField(text, PATTERNS.nomeCliente, 'Cliente não identificado'),
            telefoneCliente: extractField(text, PATTERNS.telefone, ''),
            totalLiquido: extractTotalLiquido(text),
            formaPagamento: extractField(text, PATTERNS.formaPagamento, ''),
            vencimento: extractField(text, PATTERNS.vencimento, ''),
            endereco: {
                logradouro: endereco.logradouro,
                numero: endereco.numero,
                bairro: endereco.bairro,
                original: endereco.original
            },
            itens: extractItems(text)
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
