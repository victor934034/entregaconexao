const { Pedido, Usuario } = require('./src/models');

async function testQuery() {
    try {
        console.log('--- TESTE DE DIAGNÓSTICO DE PEDIDOS ---');

        // 1. Verificando todos os pedidos e seus status/entregadores
        const all = await Pedido.findAll({
            include: [{ model: Usuario, as: 'entregador', attributes: ['id', 'nome'] }]
        });

        console.log(`Total de pedidos encontrados: ${all.length}`);
        all.forEach(p => {
            console.log(`ID: ${p.id}, Numero: ${p.numero_pedido}, Status: "${p.status}", Entregador ID: ${p.entregador_id}`);
        });

        // 2. Testando a query exata que o app falha
        const uid = 2; // UID que estava no logcat
        const { Op } = require('sequelize');
        const where = {
            [Op.or]: [
                { entregador_id: uid },
                { status: 'PENDENTE' }
            ]
        };

        const result = await Pedido.findAll({ where });
        console.log(`\nResultado da query (UID 2 OR PENDENTE): ${result.length} pedidos`);

        process.exit(0);
    } catch (error) {
        console.error('Erro no diagnóstico:', error);
        process.exit(1);
    }
}

testQuery();
