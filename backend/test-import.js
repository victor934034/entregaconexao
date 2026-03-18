const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function test() {
    try {
        const form = new FormData();
        form.append('pdf', fs.createReadStream('../Borderô de EntregaCobrança (1).PDF'));
        form.append('csv', fs.createReadStream('../Relatório LS.CSV'));

        // Se a API for protegida localmente precisaria de auth
        // Mas podemos adicionar um skipToken ou tentar uma req sem token se authLocal permitir

        console.log("Enviando requisição...");
        const response = await axios.post('http://localhost:5000/pedidos/importar-lote', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log("Sucesso:", response.data);
    } catch (err) {
        console.error("Erro status:", err.response?.status);
        console.error("Erro data:", err.response?.data);
    }
}

test();
