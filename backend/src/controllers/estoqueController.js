const supabase = require('../config/supabase');

exports.listarEstoque = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('estoque')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao listar estoque:', error);
        res.status(500).json({ error: 'Erro ao listar estoque.' });
    }
};

exports.detalhesEstoque = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('estoque')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Item não encontrado.' });

        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar item no estoque:', error);
        res.status(500).json({ error: 'Erro ao buscar item.' });
    }
};

exports.criarItemEstoque = async (req, res) => {
    try {
        const { nome, quantidade, modo_estocagem, custo, preco_venda } = req.body;
        let foto_url = null;

        if (req.file) {
            // Upload to Supabase Storage
            const fileExt = req.file.originalname.split('.').pop();
            const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data: storageData, error: storageError } = await supabase.storage
                .from('estoque_imagens')
                .upload(filePath, req.file.buffer, {
                    contentType: req.file.mimetype,
                });

            if (storageError) throw storageError;

            const { data: publicUrlData } = supabase.storage
                .from('estoque_imagens')
                .getPublicUrl(filePath);

            foto_url = publicUrlData.publicUrl;
        }

        const { data, error } = await supabase
            .from('estoque')
            .insert([{
                nome,
                quantidade: parseFloat(quantidade) || 0,
                modo_estocagem,
                custo: parseFloat(custo) || 0,
                preco_venda: parseFloat(preco_venda) || 0,
                foto_url
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Erro ao criar item no estoque:', error);
        res.status(500).json({ error: 'Erro ao criar item.', details: error.message });
    }
};

exports.atualizarItemEstoque = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, quantidade, modo_estocagem, custo, preco_venda } = req.body;

        let updateData = {
            nome,
            quantidade: parseFloat(quantidade) || 0,
            modo_estocagem,
            custo: parseFloat(custo) || 0,
            preco_venda: parseFloat(preco_venda) || 0,
        };

        if (req.file) {
            const fileExt = req.file.originalname.split('.').pop();
            const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data: storageData, error: storageError } = await supabase.storage
                .from('estoque_imagens')
                .upload(filePath, req.file.buffer, {
                    contentType: req.file.mimetype,
                });

            if (storageError) throw storageError;

            const { data: publicUrlData } = supabase.storage
                .from('estoque_imagens')
                .getPublicUrl(filePath);

            updateData.foto_url = publicUrlData.publicUrl;
        }

        const { data, error } = await supabase
            .from('estoque')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error('Erro ao atualizar item do estoque:', error);
        res.status(500).json({ error: 'Erro ao atualizar item.', details: error.message });
    }
};

exports.excluirItemEstoque = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('estoque')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Item excluído com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir item.' });
    }
};
