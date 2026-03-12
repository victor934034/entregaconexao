const fs = require('fs');
const pdf = require('pdf-parse');

const PATTERNS = {
    numeroPedido: /PEDIDO\s+Nº\s*([\d.]+)/i,
    dataPedido: /Data:\s*(\d{2}\/\d{2}\/\d{4}|\d{2}\/\d{2}\/\d{2}|\d{2}\/[A-Za-z]+\/\d{4})/i,
    dataEntrega: /(?:Previsão Entrega|Data Entrega|Entregar em):\s*(\d{2}\/\d{2}\/\d{4})/i,
    horaEntrega: /(?:Hora Entrega|Horário):\s*(\d{2}:\d{2})/i,
    nomeCliente: /Nome:\s*(?:\d+[-]\s*)?([^/\n\r\d(]+?)(?:\s+-\s+|\s*[/]|Fone:|$)/i,
    formaPagamento: /Forma Pg\n(?:.*\n){3}([A-ZÀ-Ú\s]+)\n/i,
    vencimento: /\(\d\)(\d{2}\/\d{2}\/\d{2})/i,
    telefone: /(?:Fone|Celular):\s*([\d\s()-]+?)(?=\s*(?:E-mail|CPF|CNPJ|Endere|CEP|Inscrição|\n|$))/i
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

function extractTelefoneCliente(text) {
    // 0. Tentar extrair telefone misturado na mesma linha do Nome ou logo abaixo (janela de 300 chars)
    const blockMatch = text.match(/Nome:[\s\S]{1,300}/i);
    if (blockMatch) {
        const block = blockMatch[0];
        // Busca por padrões de telefone (41) 99999-9999 ou 41 9999-9999
        const foneRegex = /(?:\(?\d{2}\)?\s*)?9?\d{4,5}[-\s]*\d{4}/g;
        const potentialFones = block.match(foneRegex);

        if (potentialFones) {
            for (const fone of potentialFones) {
                const num = fone.replace(/\D/g, '');
                // Excluir shop phone 995278067
                if (!num.includes('995278067') && num.length >= 8) {
                    return { value: fone.trim(), confianca: 'alta' };
                }
            }
        }
    }

    // 1. Tentar pegar Fone: rotulado especificamente em qualquer parte (exceto da loja)
    const matches = [...text.matchAll(/Fone:\s*([\d\s()-]+?)(?=\s*(?:E-mail|CPF|CNPJ|Endere|CEP|Inscrição|\n|$))/gi)];
    for (const m of matches) {
        let t = m[1].trim();
        let nums = t.replace(/\D/g, '');
        if (!nums.includes('995278067') && nums.length >= 8) {
            return { value: t, confianca: 'média' };
        }
    }

    return { value: '', confianca: 'baixa' };
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

        // Detectar se é uma Lista de Entrega e Cobrança
        if (text.includes('L I S T A   DE   E N T R E G A   E   C O B R A N Ç A')) {
            return await parseListaEntrega(text);
        }

        const endereco = decomporEndereco(text);
        const parsedData = {
            isMulti: false,
            numeroPedido: extractField(text, PATTERNS.numeroPedido, '000'),
            dataPedido: extractField(text, PATTERNS.dataPedido, ''),
            dataEntregaProgramada: extractField(text, PATTERNS.dataEntrega, ''),
            horaEntregaProgramada: extractField(text, PATTERNS.horaEntrega, ''),
            nomeCliente: extractField(text, PATTERNS.nomeCliente, 'Cliente não identificado'),
            telefoneCliente: extractTelefoneCliente(text),
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

async function parseListaEntrega(text) {
    const orders = [];
    // Encontrar o bloco de R E L A Ç Ã O   DE  E N T R E G A S
    const relacaoStart = text.indexOf('R E L A Ç Ã O   DE  E N T R E G A S');
    if (relacaoStart === -1) return { isMulti: false, error: 'Lista de entrega não identificada' };

    const relacaoText = text.substring(relacaoStart);

    // Split por marcadores de item: "  001", "  002", etc no início da linha
    // O padrão parece ser: duas espaços + 3 dígitos + espaço(s) + 14 espaços + número da nota
    const itemSplitRegex = /\n\s{2}(\d{3})\s{14,}/g;
    const blocks = relacaoText.split(itemSplitRegex);

    // O primeiro bloco é o cabeçalho da relação
    for (let i = 1; i < blocks.length; i += 2) {
        const itemIdx = blocks[i];
        const content = blocks[i + 1];
        if (!content) continue;

        const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) continue;

        // Linha 1: Nota Fiscal Venda e Nome/Fone
        // Ex: "029643  DIEGO - 4199611 - 3479"
        const headerLine = lines[0];
        const nfMatch = headerLine.match(/^(\d+)/);
        const numero_pedido = nfMatch ? nfMatch[1] : `LISTA-${itemIdx}`;

        let restoHeader = headerLine.replace(/^\d+/, '').trim();
        // Separar Nome e Fone se possível
        let nome_cliente = restoHeader;
        let telefone_cliente = '';

        // Se tiver "-", o que vem depois costuma ser fone
        if (restoHeader.includes(' - ')) {
            const parts = restoHeader.split(' - ');
            nome_cliente = parts[0].trim();
            telefone_cliente = parts.slice(1).join(' - ').trim();
        } else if (restoHeader.match(/\d{2}/)) { // Se tiver números, tenta pegar como fone
            const phoneMatch = restoHeader.match(/(.*?)\s+(\d.*)/);
            if (phoneMatch) {
                nome_cliente = phoneMatch[1].trim();
                telefone_cliente = phoneMatch[2].trim();
            }
        }

        // Linha 2: Data, Forma Pgto e Valor
        // Ex: "12/03/2026            DINHEIRO             239,75"
        const dataLine = lines[1];
        const dataMatch = dataLine.match(/(\d{2}\/\d{2}\/\d{4})/);
        const data_pedido = dataMatch ? dataMatch[1] : '';

        const valorMatch = dataLine.match(/(\d+,\d{2})$/);
        const total_liquido = valorMatch ? valorMatch[1] : '0,00';

        // Forma de pagamento fica entre a data e o valor
        let forma_pagamento = dataLine.replace(data_pedido || '', '').replace(total_liquido || '', '').trim();

        // Tentar extrair endereço da Linha 3 (se existir e não for um item)
        let endereco = { logradouro: '', numero: '', bairro: '', observacao: '' };
        if (lines.length > 2 && !lines[2].match(/^\d+\d+\s+/) && !lines[2].match(/^\d{3}\s+/)) {
            const addressLine = lines[2];
            // Tenta decompor o endereço
            const parts = addressLine.split(',').map(p => p.trim());
            if (parts.length >= 2) {
                endereco.logradouro = parts[0];
                const numParts = parts[1].split(' ');
                endereco.numero = numParts[0];
                if (numParts.length > 1) {
                    endereco.bairro = numParts.slice(1).join(' ');
                }
            } else {
                endereco.logradouro = addressLine;
            }
        }

        // Extrair itens deste bloco
        const itens = [];
        const itemLineRegex = /^(\d+)\d+\s+(.+?)\.{2,}(\d+[\d,.]*)/;
        lines.forEach(line => {
            const m = line.match(itemLineRegex);
            if (m) {
                itens.push({
                    idx: parseInt(m[1]),
                    descricao: m[2].trim(),
                    quantidade: parseFloat(m[3].replace(',', '.')),
                    unidade: 'un' // Unidade padrão para lista
                });
            }
        });

        orders.push({
            numeroPedido: { value: numero_pedido, confianca: 'alta' },
            dataPedido: { value: data_pedido, confianca: 'alta' },
            nomeCliente: { value: nome_cliente, confianca: 'alta' },
            telefoneCliente: { value: telefone_cliente, confianca: 'alta' },
            totalLiquido: { value: total_liquido, confianca: 'alta' },
            formaPagamento: { value: forma_pagamento, confianca: 'alta' },
            endereco: endereco,
            itens: itens,
            isFromList: true
        });
    }

    return {
        isMulti: true,
        pedidos: orders
    };
}

module.exports = {
    parsePedidoPdf
};
