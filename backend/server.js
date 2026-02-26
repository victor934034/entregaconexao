const http = require('http');
const app = require('./src/app');
const { sequelize } = require('./src/models');
const socketService = require('./src/services/socketService');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Inicializar Socket.io
socketService.init(server);

// Iniciar o servidor IMEDIATAMENTE para evitar 502/Bad Gateway no EasyPanel
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor backend rodando em http://0.0.0.0:${PORT}`);
    console.log('--- Iniciando conexão com o Banco de Dados ---');
});

// Tentar conectar e sincronizar em segundo plano
sequelize.authenticate()
    .then(() => {
        console.log('✅ Banco de dados conectado com sucesso.');
        return sequelize.sync({ alter: false });
    })
    .then(() => {
        console.log('✅ Tabelas sincronizadas.');
    })
    .catch(err => {
        console.error('❌ ERRO NO BANCO DE DADOS:', err.message);
        console.log('⚠️ O servidor continuará rodando para debug, mas as requisições ao banco falharão.');
    });
