const { Pedido, Usuario, sequelize } = require('./src/models');
const { Op } = require('sequelize');

async function debugData() {
    try {
        console.log('--- DEBUG DE BUSCA POR DATA (25/02/2026) ---');

        const dataBusca = '2026-02-25';

        // 1. Verificar o que temos no banco pura e simplesmente
        const todos = await Pedido.findAll({
            where: {
                numero_pedido: '29368'
            }
        });

        if (todos.length > 0) {
            const p = todos[0];
            console.log(`Pedido Encontrado: ID ${p.id}, Numero ${p.numero_pedido}, Data Raw: ${p.data_pedido}, Status: ${p.status}`);
        } else {
            console.log('Pedido #29.368 não encontrado por número!');
        }

        // 2. Tentar a query exata do backend atual
        const where = {
            [Op.and]: [
                sequelize.where(sequelize.fn('DATE', sequelize.col('data_pedido')), '=', dataBusca)
            ]
        };

        const result = await Pedido.findAll({ where });
        console.log(`\nBusca por data '${dataBusca}' via DATE() retornou: ${result.length} pedidos`);
        result.forEach(r => console.log(` - ID ${r.id}: Pedido #${r.numero_pedido}`));

        // 3. Tentar busca via BETWEEN (dia todo)
        const dInicio = new Date('2026-02-25T00:00:00');
        const dFim = new Date('2026-02-25T23:59:59');
        const resultBetween = await Pedido.findAll({
            where: {
                data_pedido: {
                    [Op.between]: [dInicio, dFim]
                }
            }
        });
        console.log(`\nBusca por data '${dataBusca}' via BETWEEN retornou: ${resultBetween.length} pedidos`);

        process.exit(0);
    } catch (err) {
        console.error('Erro no debug:', err);
        process.exit(1);
    }
}

debugData();
