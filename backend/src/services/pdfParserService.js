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
        let val = match[1].trim();
        // Limpeza extra para nome caso ainda venha com prefixos
        if (regex === PATTERNS.nomeCliente) {
            val = val.replace(/^[\d\s-]+/, '').trim();
        }
        return { value: val, confianca: 'alta' };
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
    // Estratégia 1: Procurar na área de Recebimento (Valor R$ 854,59) - MAIS ROBUSTO
    const recMatch = text.match(/Valor R\$\s*([\d,.]+)/i);
    if (recMatch) return { value: recMatch[1].trim(), confianca: 'alta' };

    // Estratégia 2: Procurar após o vencimento (0) data valor
    const vencMatch = text.match(/\d{2}\/\d{2}\/\d{2}\s+([\d,.]+)/);
    if (vencMatch) return { value: vencMatch[1].trim(), confianca: 'alta' };

    // Estratégia 3: Totalizadores (Fallback para o padrão anterior mas com limpeza de "esmagamento")
    const lines = text.split('\n');
    const labelIdx = lines.findIndex(l => l.includes('Total Liquido R$'));
    if (labelIdx !== -1 && lines[labelIdx + 1]) {
        const valueLine = lines[labelIdx + 1];
        const numbers = valueLine.match(/\d+,\d{2}/g); // Procura especificamente padrões de reais (XX,XX)
        if (numbers && numbers.length > 0) {
            return { value: numbers[numbers.length - 1], confianca: 'alta' };
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
        if (parts[1].toUpperCase().includes('CASA') || parts[1].toUpperCase().includes('APTO') || parts[1].toUpperCase().includes('LOJA')) {
            bairro = parts[parts.length - 1].trim();
        } else {
            bairro = parts[1].trim();
        }
    }

    // Se o número ainda estiver vazio e o logradouro tiver vírgula
    if (!numero && logradouro.includes(',')) {
        const spl = logradouro.split(',');
        logradouro = spl[0].trim();
        numero = spl[1].trim();
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

        // Log para depuração em caso de erro residual
        if (parsedData.totalLiquido.value.length > 15) {
            console.error('TOTAL LÍQUIDO ANORMAL DETECTADO:', parsedData.totalLiquido.value);
        }

        return parsedData;

    } catch (error) {
        console.error('Erro ao processar PDF:', error.message);
        throw new Error('Falha no processamento: ' + error.message);
    }
}

module.exports = {
    parsePedidoPdf
};
