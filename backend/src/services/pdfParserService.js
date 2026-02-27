const fs = require('fs');
const pdf = require('pdf-parse');

const PATTERNS = {
    numeroPedido: /PEDIDO\s+Nº\s*([\d.]+)/i,
    dataPedido: /Data:(\d{2}\/\w+\/\d{4}|\d{2}\/\d{2}\/\d{4})/i,
    dataEntrega: /(?:Previsão Entrega|Data Entrega|Entregar em):\s*(\d{2}\/\d{2}\/\d{4})/i,
    horaEntrega: /(?:Hora Entrega|Horário):\s*(\d{2}:\d{2})/i,
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
    // 1. Busca específica após a label Total Liquido R$
    const totalLiquidoPos = text.indexOf('Total Liquido R$');
    if (totalLiquidoPos !== -1) {
        const afterTotal = text.substring(totalLiquidoPos);
        // Captura padrões de moeda brasileira (vários dígitos + vírgula + 2 dígitos)
        const matches = afterTotal.match(/\d+,\d{2}/g);
        if (matches && matches.length > 0) {
            // O Total Líquido aparece repetido nos totalizadores e no recebimento. 
            // O último valor monetário após a label é o Total Líquido final.
            return { value: matches[matches.length - 1], confianca: 'alta' };
        }
    }

    // 2. Fallback agressivo: Pega o último valor monetário do documento
    const allMatches = text.match(/\d+,\d{2}/g);
    if (allMatches && allMatches.length > 0) {
        return { value: allMatches[allMatches.length - 1], confianca: 'alta' };
    }

    return { value: '0,00', confianca: 'baixa' };
}

function decomporEndereco(text) {
    const match = text.match(/Endereço de Entrega:\s*\n([\s\S]+?)(?:\s+-\s+\n|Aprovação|$)/i);
    if (!match) return { logradouro: '', numero: '', bairro: '', observacao: '', original: '' };

    const original = match[1].trim();
    // Ex: RUA TOSHIAK SAITO (PRÓX GOES), 400 - CASA 2 - UBERABA

    let parts = original.split('-');
    let logradouro = '';
    let numero = '';
    let bairro = '';
    let observacao = '';

    // Tenta detectar avisos entre parênteses ou termos comuns
    const avisoRegex = /\(([^)]+)\)|(?:PRÓX|PERTO|AO LADO|EM FRENTE|PORTÃO|CASA DE COR|CASA COR|MURO)\s+[^,-]+/gi;
    let mainText = original;
    const avisosEncontrados = original.match(avisoRegex);

    if (avisosEncontrados) {
        observacao = avisosEncontrados.join('; ');
        // Remove os avisos do texto principal para não sujar o logradouro
        avisosEncontrados.forEach(a => {
            mainText = mainText.replace(a, '');
        });
    }

    // Processa o texto limpo
    const cleanParts = mainText.split('-').map(p => p.trim()).filter(p => p.length > 0);

    if (cleanParts.length >= 1) {
        const ruaNum = cleanParts[0].split(',');
        logradouro = ruaNum[0].trim();
        if (ruaNum.length > 1) {
            numero = ruaNum[1].trim();
        }
    }

    if (cleanParts.length >= 2) {
        // Se a parte 2 for um complemento comum que não pegamos na observação
        const p2 = cleanParts[1].toUpperCase();
        if (p2.includes('CASA') || p2.includes('APTO') || p2.includes('LOJA') || p2.includes('BLOCO')) {
            if (!observacao.includes(cleanParts[1])) {
                observacao = observacao ? `${observacao}; ${cleanParts[1]}` : cleanParts[1];
            }
            if (cleanParts.length >= 3) {
                bairro = cleanParts[cleanParts.length - 1].trim();
            }
        } else {
            bairro = cleanParts[1].trim();
        }
    }

    // Se o número ainda estiver vazio e o logradouro tiver vírgula
    if (!numero && logradouro.includes(',')) {
        const spl = logradouro.split(',');
        logradouro = spl[0].trim();
        numero = spl[1].trim();
    }

    // Limpeza final de pontuação residual
    logradouro = logradouro.replace(/[(),]/g, '').trim();
    numero = numero.replace(/[(),]/g, '').trim();

    return { logradouro, numero, bairro, observacao, original };
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
            dataEntregaProgramada: extractField(text, PATTERNS.dataEntrega, ''),
            horaEntregaProgramada: extractField(text, PATTERNS.horaEntrega, ''),
            nomeCliente: extractField(text, PATTERNS.nomeCliente, 'Cliente não identificado'),
            telefoneCliente: extractField(text, PATTERNS.telefone, ''),
            totalLiquido: extractTotalLiquido(text),
            formaPagamento: extractField(text, PATTERNS.formaPagamento, ''),
            vencimento: extractField(text, PATTERNS.vencimento, ''),
            endereco: {
                logradouro: endereco.logradouro,
                numero: endereco.numero,
                bairro: endereco.bairro,
                observacao: endereco.observacao,
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
