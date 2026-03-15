const fs = require('fs');
const path = require('path');
const { parsePedidoPdf } = require('./src/services/pdfParserService');

const samplePdf = 'c:\\Users\\escola\\AndroidStudioProjects\\appdenetregasconexao2772\\arquivoapp.pdf';

async function test() {
    try {
        console.log('Testing PDF:', samplePdf);
        const result = await parsePedidoPdf(samplePdf);
        console.log('--- RESULT ---');
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('--- ERROR ---');
        console.error(error);
    }
}

test();
