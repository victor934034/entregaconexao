const bcrypt = require('bcrypt');
const { Usuario, PermissaoUsuario, Pedido } = require('../models');

exports.listarUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            attributes: { exclude: ['senha_hash'] }
        });
        return res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
};

exports.detalhesUsuario = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id, {
            attributes: { exclude: ['senha_hash'] },
            include: [{ model: PermissaoUsuario, as: 'permissoes' }]
        });
        if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });
        return res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar usuário.' });
    }
};

exports.criarUsuario = async (req, res) => {
    try {
        const { nome, email, senha, perfil } = req.body;

        const existe = await Usuario.findOne({ where: { email } });
        if (existe) {
            return res.status(400).json({ error: 'E-mail já está em uso.' });
        }

        const salt = await bcrypt.genSalt(12);
        const senha_hash = await bcrypt.hash(senha, salt);

        const novoUsuario = await Usuario.create({
            nome, email, senha_hash, perfil
        });

        // Default permissions logic would go here if needed

        return res.status(201).json({ id: novoUsuario.id, nome, email, perfil });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar usuário.' });
    }
};

exports.editarUsuario = async (req, res) => {
    try {
        const { nome, email, perfil } = req.body;
        const usuario = await Usuario.findByPk(req.params.id);

        if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });

        usuario.nome = nome || usuario.nome;
        usuario.email = email || usuario.email;
        if (req.usuario.perfil === 'SUPER_ADM') {
            usuario.perfil = perfil || usuario.perfil;
        }

        await usuario.save();
        return res.json({ message: 'Usuário atualizado com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    }
};

exports.alterarStatus = async (req, res) => {
    try {
        const { ativo } = req.body;
        const usuario = await Usuario.findByPk(req.params.id);

        if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });

        usuario.ativo = ativo;
        await usuario.save();

        return res.json({ message: `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso.` });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao alterar status.' });
    }
};

exports.listarPermissoes = async (req, res) => {
    try {
        const permissoes = await PermissaoUsuario.findAll({ where: { usuario_id: req.params.id } });
        return res.json(permissoes);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar permissões.' });
    }
};

exports.atualizarPermissoes = async (req, res) => {
    try {
        const { permissoes } = req.body; // array de perfis: { permissao: nome, permitido: true/false }
        const usuarioId = req.params.id;

        for (const p of permissoes) {
            const existente = await PermissaoUsuario.findOne({
                where: { usuario_id: usuarioId, permissao: p.permissao }
            });

            if (existente) {
                existente.permitido = p.permitido;
                await existente.save();
            } else {
                await PermissaoUsuario.create({
                    usuario_id: usuarioId,
                    permissao: p.permissao,
                    permitido: p.permitido
                });
            }
        }

        return res.json({ message: 'Permissões atualizadas com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar permissões.' });
    }
};

exports.historicoEntregas = async (req, res) => {
    try {
        const pedidos = await Pedido.findAll({
            where: { entregador_id: req.params.id },
            order: [['data_pedido', 'DESC']]
        });
        return res.json(pedidos);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar histórico de entregas.' });
    }
};
