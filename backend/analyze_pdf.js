const fs = require('fs');
const pdf = require('pdf-parse');

async function parseEstoquePdf(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        const text = data.text;
        const rawLines = text.split(/\n|\r/).map(l => l.trim()).filter(l => l.length > 0);

        const items = [];
        const ignoreRegex = /estoque|inventário|relatório|página|total|solicitar|solicitação|lista de itens|qtdun\.|cliente:/i;

        let currentItem = null;

        rawLines.forEach((line) => {
            if (ignoreRegex.test(line)) return;

            const itemStartMatch = line.match(/^(\d+)(.*)/);

            if (itemStartMatch && itemStartMatch[1].length < 10) {
                if (currentItem) {
                    processAndAddItem(currentItem, items);
                }

                currentItem = {
                    qtd: itemStartMatch[1],
                    content: itemStartMatch[2].trim()
                };
            } else if (currentItem) {
                currentItem.content += " " + line;
            }
        });

        if (currentItem) {
            processAndAddItem(currentItem, items);
        }

        function processAndAddItem(item, list) {
            let content = item.content.trim();
            const priceRegexDouble = /(?:R\$\s*)?(\d+(?:\.\d{3})*[,.]\d{2})\s*(?:R\$\s*)?(\d+(?:\.\d{3})*[,.]\d{2})$/;
            const priceRegexSingle = /(?:R\$\s*)?(\d+(?:\.\d{3})*[,.]\d{2})$/;

            let nome = content;
            let custo = 0;
            let venda = 0;

            const doubleMatch = content.match(priceRegexDouble);
            if (doubleMatch) {
                custo = parseFloat(doubleMatch[1].replace(/\./g, '').replace(',', '.'));
                venda = parseFloat(doubleMatch[2].replace(/\./g, '').replace(',', '.'));
                nome = content.substring(0, content.lastIndexOf(doubleMatch[0])).trim();
            } else {
                const singleMatch = content.match(priceRegexSingle);
                if (singleMatch) {
                    venda = parseFloat(singleMatch[1].replace(/\./g, '').replace(',', '.'));
                    nome = content.substring(0, content.lastIndexOf(singleMatch[0])).trim();
                }
            }

            let unit = 'un';
            const possibleUnits = ['PC', 'UN', 'KG', 'MT', 'CX', 'PR', 'RL', 'DZ', 'PÇ', 'DC'];

            for (const u of possibleUnits) {
                const uMatch = nome.match(new RegExp(`^(${u})(\\s+|[A-Z][a-z])`, 'i'));
                if (uMatch) {
                    unit = uMatch[1].toLowerCase();
                    nome = nome.substring(unit.length).trim();
                    break;
                }
            }

            nome = nome.replace(/^\d+[\s-.]*/, '').replace(/\.+$/, '').trim();

            if (nome.length >= 2 && !/solicitar|total/i.test(nome)) {
                list.push({
                    nome: nome,
                    quantidade: parseFloat(item.qtd),
                    modo_estocagem: unit,
                    custo: custo,
                    preco_venda: venda
                });
            }
        }

        console.log("--- DETECTED ITEMS ---");
        console.log(JSON.stringify(items, null, 2));
        console.log(`Total: ${items.length} items`);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

const filePath = process.argv[2];
parseEstoquePdf(filePath);
