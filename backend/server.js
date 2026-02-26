const http = require('http');
const app = require('./src/app');
const { sequelize } = require('./src/models');
const socketService = require('./src/services/socketService');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Inicializar Socket.io
socketService.init(server);

// Função para iniciar o servidor
const startServer = () => {
    server.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
        console.log('Ambiente:', process.env.NODE_ENV);
    });
};

// Tentar conectar e sincronizar
sequelize.authenticate()
    .then(() => {
        console.log('Banco de dados conectado com sucesso.');
        return sequelize.sync({ alter: false });
    })
    .then(() => {
        console.log('Tabelas sincronizadas.');
        startServer();
    })
    .catch(err => {
        console.error('ERRO CRÍTICO NO BANCO DE DADOS:', err.message);
        console.log('Verifique as variáveis de ambiente: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD');
        // Inicia o servidor mesmo assim para o container não crashar e podermos ver os logs
        startServer();
    });
