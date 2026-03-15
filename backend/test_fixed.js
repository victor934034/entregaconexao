const fs = require('fs');
const path = require('path');
const { parsePedidoPdf } = require('./src/services/pdfParserService');

const samplePdf = 'c:\\Users\\escola\\AndroidStudioProjects\\appdenetregasconexao2772\\itens_orcamentos-3.pdf';

async function test() {
    try {
        console.log('Testing PDF:', samplePdf);
        const result = await parsePedidoPdf(samplePdf);
        console.log('--- RESULT ---');
        console.log(JSON.stringify(result, null, 2));

        if (result.isMulti) {
            console.log(`\nFound ${result.pedidos.length} orders.`);
            result.pedidos.forEach((p, i) => {
                console.log(`Order ${i + 1}: ${p.nomeCliente.value} - ${p.itens.length} items`);
            });
        }
    } catch (error) {
        console.error('--- ERROR ---');
        console.error(error);
    }
}

test();
