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
    telefone: /(?:Fone|Celular):\s*([\d\s()-]+?)(?=\s*(?:E-mail|CPF|CNPJ|Endere|CEP|Inscrição|\n|$))/i,
    email: /(?:E-mail|Email):\s*([\w.-]+@[\w.-]+\.[a-zA-Z]{2,})/i
};

function extractField(text, regex, defaultValue = '') {
    const match = text.match(regex);
    if (match && match[1]) {
        let val = match[1].trim();
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
    const totalLiquidoPos = text.indexOf('Total Liquido R$');
    if (totalLiquidoPos !== -1) {
        const afterTotal = text.substring(totalLiquidoPos);
        const matches = afterTotal.match(/\d+,\d{2}/g);
        if (matches && matches.length > 0) {
            return { value: matches[0], confianca: 'alta' }; // It should be the first one after the label
        }
    }
    const allMatches = text.match(/\d+,\d{2}/g);
    if (allMatches && allMatches.length > 0) {
        return { value: allMatches[allMatches.length - 1], confianca: 'alta' }; // Take last one as fallback
    }
    return { value: '0,00', confianca: 'baixa' };
}

function extractTelefoneCliente(text) {
    const blockMatch = text.match(/Nome:[\s\S]{1,300}/i);
    if (blockMatch) {
        const block = blockMatch[0];
        const foneRegex = /(?:\(?\d{2}\)?\s*)?9?\d{4,5}[-\s]*\d{4}/g;
        const potentialFones = block.match(foneRegex);
        if (potentialFones) {
            for (const fone of potentialFones) {
                const num = fone.replace(/\D/g, '');
                if (!num.includes('995278067') && num.length >= 8) {
                    return { value: fone.trim(), confianca: 'alta' };
                }
            }
        }
    }
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
    let mainText = text;
    if (text.includes('Endereço de Entrega:')) {
        const match = text.match(/Endereço de Entrega:\s*\n([\s\S]+?)(?:\s+-\s+\n|Aprovação|$)/i);
        if (match) {
            mainText = match[1].trim();
        }
    } else {
        // Tenta achar o endereço após o Nome/Fone e antes dos Itens ou T.Valor R$
        const endMatch = text.match(/(?:Fone|Celular):.*?\n([\s\S]+?)(?:Previsão Entrega|Data Entrega|Entregar em|T\.Valor R\$|Forma Pg|Vendedor|Condição)/i);
        if (endMatch) {
            mainText = endMatch[1].trim();
        }
    }

    const original = mainText;
    let logradouro = '';
    let numero = '';
    let bairro = '';
    let observacao = '';

    const avisoRegex = /\(([^)]+)\)|(?:PRÓX|PERTO|AO LADO|EM FRENTE|PORTÃO|CASA DE COR|CASA COR|MURO)\s+[^,-]+/gi;
    let mainText = original;
    const avisosEncontrados = original.match(avisoRegex);

    if (avisosEncontrados) {
        observacao = avisosEncontrados.join('; ');
        avisosEncontrados.forEach(a => {
            mainText = mainText.replace(a, '');
        });
    }

    const cleanParts = mainText.split('-').map(p => p.trim()).filter(p => p.length > 0);
    if (cleanParts.length >= 1) {
        const ruaNum = cleanParts[0].split(',');
        logradouro = ruaNum[0].trim();
        if (ruaNum.length > 1) {
            numero = ruaNum[1].trim();
        }
    }

    if (cleanParts.length >= 2) {
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

    if (!numero && logradouro.includes(',')) {
        const spl = logradouro.split(',');
        logradouro = spl[0].trim();
        numero = spl[1].trim();
    }

    logradouro = logradouro.replace(/[(),]/g, '').trim();
    numero = numero.replace(/[(),]/g, '').trim();

    return { endereco: logradouro, numero, bairro, observacao, original };
}

async function parsePedidoPdf(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        const text = data.text;

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
            emailCliente: extractField(text, PATTERNS.email, ''),
            totalLiquido: extractTotalLiquido(text),
            formaPagamento: extractField(text, PATTERNS.formaPagamento, ''),
            vencimento: extractField(text, PATTERNS.vencimento, ''),
            endereco: {
                endereco: endereco.endereco,
                numero: endereco.numero,
                bairro: endereco.bairro,
                observacao: endereco.observacao,
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

async function parseListaEntrega(text) {
    const orders = [];

    const boundaryPoints = [];
    const boundaryRegex = /(\n\s{2}|\r\s{2})\d{3}\s{5,}(\d{6,})/g;
    let match;
    while ((match = boundaryRegex.exec(text)) !== null) {
        boundaryPoints.push({ index: match.index, nf: match[2] });
    }

    if (boundaryPoints.length === 0) {
        const aggressiveRegex = /\d{3}\s{10,}(\d{6,})/ig;
        while ((match = aggressiveRegex.exec(text)) !== null) {
            boundaryPoints.push({ index: match.index, nf: match[1] });
        }
    }

    for (let i = 0; i < boundaryPoints.length; i++) {
        const start = boundaryPoints[i].index;
        const end = boundaryPoints[i + 1] ? boundaryPoints[i + 1].index : text.length;
        const originalBlock = text.substring(start, end);
        const normalizedBlock = originalBlock.replace(/\s+/g, ' ');

        const pedido = {
            numeroPedido: { value: boundaryPoints[i].nf, confianca: 'alta' },
            dataPedido: { value: '', confianca: 'baixa' },
            nomeCliente: { value: '', confianca: 'baixa' },
            telefoneCliente: { value: '', confianca: 'baixa' },
            emailCliente: { value: '', confianca: 'baixa' },
            totalLiquido: { value: '0,00', confianca: 'baixa' },
            formaPagamento: { value: '', confianca: 'baixa' },
            endereco: { endereco: '', numero: '', bairro: '', observacao: '' },
            itens: [],
            isFromList: true
        };

        const dateMatch = normalizedBlock.match(/(\d{2}\/\d{2}\/\d{4})/);
        if (dateMatch) {
            pedido.dataPedido = { value: dateMatch[1], confianca: 'alta' };
            const afterDate = normalizedBlock.substring(dateMatch.index + dateMatch[0].length).trim();
            // Forma de pagamento geralmente está após a data, ou no final. Vamos ser mais flexíveis
            const pgtoMatch = afterDate.match(/(Dinheiro|Cartão|Pix|Boleto|Transferência[a-zA-ZÀ-Ú\s]*)\b/i);
            if (pgtoMatch) {
                pedido.formaPagamento = { value: pgtoMatch[0].trim(), confianca: 'alta' };
            } else {
                const generalPgto = afterDate.match(/^[A-ZÀ-Ú\s]{3,20}\b/);
                if (generalPgto && !generalPgto[0].includes('T.Valor')) {
                    pedido.formaPagamento = { value: generalPgto[0].trim(), confianca: 'média' };
                }
            }
        }

        const moneyMatches = [...normalizedBlock.matchAll(/(\d[\d.]*,\d{2})/g)];
        if (moneyMatches.length > 0) {
            pedido.totalLiquido = { value: moneyMatches[moneyMatches.length - 1][1], confianca: 'alta' };
        }

        let headerText = '';
        if (dateMatch) {
            headerText = normalizedBlock.split(pedido.numeroPedido.value)[1].split(dateMatch[1])[0].trim();
        } else {
            headerText = normalizedBlock.split(pedido.numeroPedido.value)[1];
            if (headerText) {
                if (headerText.indexOf('T.Valor') !== -1) {
                    headerText = headerText.split('T.Valor')[0].trim();
                }
            } else {
                headerText = '';
            }
        }

        if (headerText.includes(' - ')) {
            const p = headerText.split(' - ');
            pedido.nomeCliente = { value: p[0].trim(), confianca: 'alta' };
            pedido.telefoneCliente = { value: p.slice(1).join(' - ').trim(), confianca: 'alta' };
        } else {
            const foneEndMatch = headerText.match(/(.*?)\s+((?:\(?\d{2}\)?\s*)?9?\d{4,5}[-\s]*\d{4}.*)/);
            if (foneEndMatch) {
                pedido.nomeCliente = { value: foneEndMatch[1].trim(), confianca: 'alta' };
                pedido.telefoneCliente = { value: foneEndMatch[2].trim(), confianca: 'alta' };
            } else {
                pedido.nomeCliente = { value: headerText, confianca: 'média' };
            }
        }

        // Tentar extrair endereço no Multi-PDF (que fica entre o header e os itens)
        let possibleAddress = '';
        if (dateMatch) {
            possibleAddress = originalBlock.substring(originalBlock.indexOf(dateMatch[1]) + dateMatch[1].length);
            const tValorIdx = possibleAddress.indexOf('T.Valor R$');
            if (tValorIdx !== -1) {
                possibleAddress = possibleAddress.substring(0, tValorIdx);
            }
        }
        if (possibleAddress.length > 5) {
            const endDec = decomporEndereco(possibleAddress);
            pedido.endereco = {
                endereco: endDec.endereco,
                numero: endDec.numero,
                bairro: endDec.bairro,
                observacao: endDec.observacao
            };
        }

        // Itens: Usa o originalBlock pois tem newlines
        const itemsPrefix = "T.Valor R$";
        const itemsAreaIndex = originalBlock.indexOf(itemsPrefix);
        if (itemsAreaIndex !== -1) {
            const itemsArea = originalBlock.substring(itemsAreaIndex + itemsPrefix.length);
            const itemLines = itemsArea.split(/\n|\r/).map(l => l.trim()).filter(l => l.length > 5); // 5 chars minimo
            let idx = 1;
            itemLines.forEach(line => {
                // Regex mais flexível: captura quantidades decimais no final
                const flexRegex = /^(\d+)?\s*(.+?)\s+(\d+[,.]\d{2,3}|\d+)\s*(un|pç|kg|mt)?/i;
                const m = line.match(flexRegex);

                // fallback pra formato denso
                const dense = line.match(/^(\d{1})?(\d{6,})?(.+?)\.{3,}(\d+[,.]\d{3}),(\d{3})(\d+[,.]\d{2})$/);

                if (dense && dense[3]) {
                    pedido.itens.push({
                        idx: idx++,
                        descricao: dense[3].trim(),
                        quantidade: parseFloat(dense[4].replace(',', '.')),
                        unidade: 'un'
                    });
                } else if (m && m[2] && m[2].length > 3 && !m[2].includes('Total')) {
                    // Try to extract quantity from end if flex didn't catch properly in group 3
                    let desc = m[2].trim();
                    let qtd = 1;

                    const endQtd = line.match(/(\d+[,.]\d{2,4}|\d+)\s*(un|pç|kg|mt)?\s*(\d+[,.]\d{2})?$/i);
                    if (endQtd) {
                        qtd = parseFloat(endQtd[1].replace(',', '.'));
                    }

                    pedido.itens.push({
                        idx: idx++,
                        descricao: desc.replace(/\.+$/, '').trim(),
                        quantidade: qtd,
                        unidade: m[4] || 'un'
                    });
                }
            });
        }

        orders.push(pedido);
    }

    return { isMulti: true, pedidos: orders };
}

module.exports = {
    parsePedidoPdf
};
