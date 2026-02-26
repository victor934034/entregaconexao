const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve PDFs route
app.use('/uploads/pdfs', express.static(path.join(__dirname, '../uploads/pdfs')));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/pedidos', require('./routes/pedido.routes'));
app.use('/api/usuarios', require('./routes/usuario.routes'));
app.use('/api/relatorios', require('./routes/relatorio.routes'));

app.get('/', (req, res) => {
    res.send('API Conexão BR277 funcionando!');
});

module.exports = app;
