const http = require('http');
const app = require('./src/app');
const { sequelize } = require('./src/models');
const socketService = require('./src/services/socketService');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Inicializar Socket.io
socketService.init(server);

// Sincronizar banco de dados e iniciar servidor
sequelize.authenticate()
    .then(() => {
        console.log('Banco de dados conectado com sucesso.');

        // Sincronizar as tabelas (force: false para não remover dados existentes)
        return sequelize.sync({ alter: false });
    })
    .then(() => {
        console.log('Tabelas sincronizadas.');
        server.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Erro ao conectar com o banco de dados:', err);
    });
