const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const samplePdf = 'c:\\Users\\escola\\AndroidStudioProjects\\appdenetregasconexao2772\\itens_orcamentos-3.pdf';

async function test() {
    try {
        const dataBuffer = fs.readFileSync(samplePdf);
        const data = await pdf(dataBuffer);
        console.log('--- RAW TEXT START ---');
        console.log(data.text);
        console.log('--- RAW TEXT END ---');
    } catch (error) {
        console.error('--- ERROR ---');
        console.error(error);
    }
}

test();
