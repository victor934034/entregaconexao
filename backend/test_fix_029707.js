const { parsePedidoPdf } = require('./src/services/pdfParserService');
const path = require('path');
const fs = require('fs');

async function runTest() {
    const pdfPath = path.join(__dirname, '..', 'Borderô de EntregaCobrança (1).PDF');

    console.log('Testing with PDF:', pdfPath);

    try {
        const result = await parsePedidoPdf(pdfPath);

        if (result.isMulti) {
            console.log(`Found ${result.pedidos.length} orders.`);
            const targetOrder = result.pedidos.find(p => p.numeroPedido.value.includes('29707') || p.numeroPedido.value === '29707' || p.numeroPedido.value === '029707');

            if (targetOrder) {
                console.log('SUCCESS: Order 29707 found!');
                console.log('Details:', JSON.stringify(targetOrder, null, 2));
            } else {
                console.error('FAILURE: Order 29707 NOT found in the list.');
                console.log('Available orders:', result.pedidos.map(p => p.numeroPedido.value).join(', '));
            }
        } else {
            console.log('PDF is NOT a multi-order list.');
            if (result.numeroPedido.value.includes('29707')) {
                console.log('SUCCESS: Order 29707 found in single order PDF!');
            } else {
                console.error('FAILURE: Order 29707 NOT found. Found:', result.numeroPedido.value);
            }
        }
    } catch (error) {
        console.error('Error during test:', error);
    }
}

runTest();
