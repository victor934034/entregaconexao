const fs = require('fs');
const pdf = require('pdf-parse');

async function test() {
    const dataBuffer = fs.readFileSync('../../arquivoapp.pdf');
    const data = await pdf(dataBuffer);
    const text = data.text;
    console.log("------- PDF TEXT -------");
    console.log(text);
    console.log("------------------------");

    // Test Data Pedido
    console.log("Regex Data Original:", text.match(/Data:(\d{2}\/\w+\/\d{4}|\d{2}\/\d{2}\/\d{4})/i));
    console.log("Regex Data Novo:", text.match(/Data:\s*(\d{2}\/\w+\/\d{4}|\d{2}\/\d{2}\/\d{4}|\d{2}\/\d{2}\/\d{2})/i));

    // Test Telefone in Nome
    const nomeLineMatch = text.match(/Nome:([^\n]+)/i);
    console.log("Linha Nome:", nomeLineMatch ? nomeLineMatch[1].trim() : null);
    if (nomeLineMatch) {
        // matches exactly: 1-CELSO - 41 99605 - 4750 /
        // looking for phone:
        const foneNoNome = nomeLineMatch[1].match(/(?:\(?\d{2}\)?\s*)?9?\d{4}[-\s]*\d{4}/);
        console.log("Telefone no Nome:", foneNoNome ? foneNoNome[0] : null);
    }
}
test().catch(console.error);
