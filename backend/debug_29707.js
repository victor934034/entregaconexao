const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const samplePdf = path.join(__dirname, '..', 'Borderô de EntregaCobrança (1).PDF');

async function test() {
    console.log('Starting test for:', samplePdf);
    if (!fs.existsSync(samplePdf)) {
        console.error('File NOT found at:', samplePdf);
        process.exit(1);
    }

    const timer = setTimeout(() => {
        console.error('TIMED OUT after 15s');
        process.exit(1);
    }, 15000);

    try {
        const dataBuffer = fs.readFileSync(samplePdf);
        console.log('Buffer read, size:', dataBuffer.length);
        const data = await pdf(dataBuffer);
        const text = data.text;

        console.log('--- SEARCHING FOR 29707 ---');
        const lines = text.split('\n');
        let found = false;
        lines.forEach((line, i) => {
            if (line.includes('29707')) {
                found = true;
                console.log(`Line ${i}: ${line.trim()}`);
                // Print surrounding lines
                for (let j = Math.max(0, i - 5); j <= Math.min(lines.length - 1, i + 10); j++) {
                    console.log(`[${j}] ${lines[j].trim()}`);
                }
            }
        });

        if (!found) {
            console.log('29707 NOT FOUND IN PDF TEXT');
            // Check for variants like "29.707"
            if (text.includes('29.707')) console.log('Found variant: 29.707');
            if (text.includes('029707')) console.log('Found variant: 029707');
        }

        clearTimeout(timer);
    } catch (error) {
        console.error('--- ERROR ---');
        console.error(error);
        process.exit(1);
    }
}

test();
