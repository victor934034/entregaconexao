const { Pedido, ItemPedido, HistoricoStatus, Usuario, sequelize } = require('../models');
const { parsePedidoPdf } = require('../services/pdfParserService');
const socketService = require('../services/socketService');

exports.listarPedidos = async (req, res) => {
    try {
        const { status, busca, dataInicio, dataFim } = req.query;

        const where = {};
        if (status) where.status = status;
        // Lógica para busca e datas seria inserida aqui usando operadores do Sequelize (Op)

        // Se for entregador, filtra apenas os dele
        if (req.usuario.perfil === 'ENTREGADOR') {
            where.entregador_id = req.usuario.id;
        }

        const pedidos = await Pedido.findAll({
            where,
            include: [
                { model: Usuario, as: 'entregador', attributes: ['id', 'nome'] }
            ],
            order: [['data_pedido', 'DESC']]
        });

        return res.json(pedidos);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar pedidos.' });
    }
};

exports.detalhesPedido = async (req, res) => {
    try {
        const pedido = await Pedido.findByPk(req.params.id, {
            include: [
                { model: ItemPedido, as: 'itens' },
                { model: Usuario, as: 'entregador', attributes: ['id', 'nome'] },
                { model: HistoricoStatus, as: 'historicos', include: [{ model: Usuario, as: 'autor', attributes: ['nome'] }] }
            ]
        });

        if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado.' });

        // Regra de negócios para ENTREGADOR ver o pedido
        if (req.usuario.perfil === 'ENTREGADOR' && pedido.entregador_id !== req.usuario.id) {
            return res.status(403).json({ error: 'Acesso negado a este pedido.' });
        }

        return res.json(pedido);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar detalhes do pedido.' });
    }
};

exports.criarPedido = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const dadosPedido = req.body;
        dadosPedido.criado_por = req.usuario.id;

        const novoPedido = await Pedido.create(dadosPedido, { transaction: t });

        if (dadosPedido.itens && dadosPedido.itens.length > 0) {
            const itens = dadosPedido.itens.map(i => ({ ...i, pedido_id: novoPedido.id }));
            await ItemPedido.bulkCreate(itens, { transaction: t });
        }

        await HistoricoStatus.create({
            pedido_id: novoPedido.id,
            status_para: novoPedido.status,
            alterado_por: req.usuario.id,
            observacao: 'Pedido criado.'
        }, { transaction: t });

        await t.commit();

        socketService.getIO().emit('pedido:criado', novoPedido);

        return res.status(201).json(novoPedido);
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: 'Erro ao criar pedido.' });
    }
};

exports.importarPdf = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo PDF enviado.' });
        }
        const pdfPath = req.file.path;
        const extractedData = await parsePedidoPdf(pdfPath);

        extractedData.arquivo_pdf_path = req.file.filename;

        return res.json(extractedData);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao processar PDF.' });
    }
};

exports.editarPedido = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const pedido = await Pedido.findByPk(req.params.id);
        if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado.' });

        await pedido.update(req.body, { transaction: t });

        // Atualiza itens (se necessário: remove os antigos e reinsere ou update on duplicate key)
        if (req.body.itens) {
            await ItemPedido.destroy({ where: { pedido_id: pedido.id }, transaction: t });
            const itens = req.body.itens.map(i => ({ ...i, pedido_id: pedido.id }));
            await ItemPedido.bulkCreate(itens, { transaction: t });
        }

        await t.commit();

        socketService.getIO().emit('pedido:atualizado', pedido);

        return res.json({ message: 'Pedido atualizado.', pedido });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: 'Erro ao editar pedido.' });
    }
};

exports.atualizarStatus = async (req, res) => {
    try {
        const { status, observacao } = req.body;
        const pedido = await Pedido.findByPk(req.params.id);

        if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado.' });

        const statusDe = pedido.status;
        pedido.status = status;
        await pedido.save();

        await HistoricoStatus.create({
            pedido_id: pedido.id,
            status_de: statusDe,
            status_para: status,
            alterado_por: req.usuario.id,
            observacao: observacao || ''
        });

        socketService.getIO().emit('pedido:status', { pedidoId: pedido.id, status });

        return res.json({ message: 'Status atualizado com sucesso.', pedido });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar status.' });
    }
};

exports.excluirPedido = async (req, res) => {
    try {
        const pedido = await Pedido.findByPk(req.params.id);
        if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado.' });

        await pedido.destroy();

        socketService.getIO().emit('pedido:excluido', { pedidoId: req.params.id });

        return res.json({ message: 'Pedido excluído com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir pedido.' });
    }
};

exports.pedidosEntregador = async (req, res) => {
    try {
        const { dataInicio, dataFim } = req.query;
        const { uid } = req.params;
        const { Op } = require('sequelize');

        console.log(`[DEBUG_API] Buscando pedidos para UID: ${uid}. Query params:`, req.query);

        const where = {
            [Op.or]: [
                { entregador_id: uid },
                { status: 'PENDENTE' }
            ]
        };

        if (dataInicio && dataFim) {
            where.data_pedido = {
                [Op.between]: [new Date(dataInicio), new Date(dataFim)]
            };
        } else if (dataInicio) {
            where.data_pedido = {
                [Op.gte]: new Date(dataInicio)
            };
        }

        const pedidos = await Pedido.findAll({
            where,
            order: [['data_pedido', 'DESC']]
        });
        return res.json(pedidos);
    } catch (error) {
        console.error('Erro ao buscar entregas:', error);
        res.status(500).json({ error: 'Erro ao buscar entregas.' });
    }
};
