const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

async function debug() {
    const filePath = 'c:/Users/escola/AndroidStudioProjects/appdenetregasconexao2772/arquivoapp.pdf';
    if (!fs.existsSync(filePath)) {
        console.error('Arquivo não encontrado:', filePath);
        return;
    }

    const dataBuffer = fs.readFileSync(filePath);
    try {
        const data = await pdf(dataBuffer);
        console.log('--- INICIO DO TEXTO ---');
        console.log(data.text);
        console.log('--- FIM DO TEXTO ---');

        // Simular a lógica do parser atual
        const text = data.text;

        const recMatch = text.match(/Valor R\$\s*([\d,.]+)/i);
        console.log('Match Recebimento:', recMatch ? recMatch[0] : 'null');

        const vencMatch = text.match(/\d{2}\/\d{2}\/\d{2}\s+([\d,.]+)/);
        console.log('Match Vencimento:', vencMatch ? vencMatch[0] : 'null');

        const lines = text.split('\n');
        const labelIdx = lines.findIndex(l => l.includes('Total Liquido R$'));
        if (labelIdx !== -1 && lines[labelIdx + 1]) {
            const nextLine = lines[labelIdx + 1];
            console.log('Linha após Total Liquido:', nextLine);
            const nums = nextLine.match(/\d+,\d{2}/g);
            console.log('Números encontrados:', nums);
        }

    } catch (err) {
        console.error('Erro no processamento:', err);
    }
}

debug();
