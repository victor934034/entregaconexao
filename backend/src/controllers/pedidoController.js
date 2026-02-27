const { Pedido, ItemPedido, HistoricoStatus, Usuario, sequelize } = require('../models');
const { parsePedidoPdf } = require('../services/pdfParserService');
const socketService = require('../services/socketService');
const { Op } = require('sequelize');

exports.listarPedidos = async (req, res) => {
    try {
        const { status, busca, dataInicio, dataFim } = req.query;

        const where = {};

        // Se for entregador, ele vê os dele OU os pendentes
        if (req.usuario.perfil === 'ENTREGADOR') {
            where[Op.or] = [
                { entregador_id: req.usuario.id },
                { status: 'PENDENTE' }
            ];
        } else if (status) {
            where.status = status;
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
        console.error('Erro ao listar pedidos:', error);
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

        // Regra de negócios para ENTREGADOR ver o pedido (Seu próprio ou Pendente)
        if (req.usuario.perfil === 'ENTREGADOR' && pedido.entregador_id !== req.usuario.id && pedido.status !== 'PENDENTE') {
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
        console.error('Erro ao criar pedido:', error);
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

        // Se o entregador está assumindo um pedido pendente
        if (status === 'EM_ROTA' && !pedido.entregador_id && req.usuario.perfil === 'ENTREGADOR') {
            pedido.entregador_id = req.usuario.id;
        }

        await pedido.save();

        await HistoricoStatus.create({
            pedido_id: pedido.id,
            status_de: statusDe,
            status_para: status,
            alterado_por: req.usuario.id,
            observacao: observacao || ''
        });

        socketService.getIO().emit('pedido:status', { pedidoId: pedido.id, status });
        socketService.getIO().emit('pedido:atualizado', pedido);

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
        const uid = parseInt(req.params.uid);

        console.log(`[DEBUG_API] Buscando pedidos para UID: ${uid}. Query params:`, req.query);

        const where = {
            [Op.or]: [
                { entregador_id: uid },
                { status: 'PENDENTE' }
            ]
        };

        if (dataInicio) {
            // Se vier apenas a data (YYYY-MM-DD), criamos o intervalo do dia todo
            const dateStr = dataInicio.split('T')[0];
            const dInicio = new Date(`${dateStr}T00:00:00`);
            const dFim = new Date(`${dateStr}T23:59:59`);

            where.data_pedido = {
                [Op.between]: [dInicio, dFim]
            };
        }

        const pedidos = await Pedido.findAll({
            where,
            include: [{ model: Usuario, as: 'entregador', attributes: ['id', 'nome'] }],
            order: [['data_pedido', 'DESC']]
        });

        console.log(`[DEBUG_API] Encontrados ${pedidos.length} pedidos.`);
        return res.json(pedidos);
    } catch (error) {
        console.error('Erro ao buscar entregas:', error);
        res.status(500).json({ error: 'Erro ao buscar entregas.' });
    }
};
