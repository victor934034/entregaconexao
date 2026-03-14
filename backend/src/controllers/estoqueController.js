const supabase = require('../config/supabase');
const { gerarPdfEstoque } = require('../services/pdfExportService');
const { parseEstoquePdf } = require('../services/pdfParserService');

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

exports.exportarPdf = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('estoque')
            .select('*')
            .order('nome', { ascending: true });

        if (error) throw error;

        const pdfBytes = await gerarPdfEstoque(data);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=estoque.pdf');
        res.send(Buffer.from(pdfBytes));
    } catch (error) {
        console.error('Erro ao exportar PDF do estoque:', error);
        res.status(500).json({ error: 'Erro ao exportar PDF.' });
    }
};

exports.importarPdf = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo PDF enviado.' });
        }
        const items = await parseEstoquePdf(req.file.path);
        return res.json(items);
    } catch (error) {
        console.error('Erro ao processar PDF de estoque:', error);
        res.status(500).json({ error: 'Erro ao processar PDF.', details: error.message });
    }
};
exports.batchCriarItens = async (req, res) => {
    try {
        console.log('--- BATCH IMPORT START (v2.1) ---');
        const items = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            console.error('Lote vazio ou inválido:', items);
            return res.status(400).json({ error: 'Nenhum item enviado.' });
        }

        console.log(`Processando lote de ${items.length} itens.`);

        // Prepara os dados com validação rigorosa
        const itemsToInsert = items.map((item, index) => {
            const qty = parseFloat(item.quantidade);
            const cst = parseFloat(item.custo);
            const vnd = parseFloat(item.preco_venda);

            if (!item.nome) {
                console.warn(`Item no índice ${index} sem nome:`, item);
            }

            return {
                nome: item.nome || 'Produto Sem Nome',
                quantidade: isNaN(qty) ? 0 : qty,
                modo_estocagem: item.modo_estocagem || 'un',
                custo: isNaN(cst) ? 0 : cst,
                preco_venda: isNaN(vnd) ? 0 : vnd
            };
        });

        console.log('Payload final para Supabase:', JSON.stringify(itemsToInsert.slice(0, 2), null, 2), '...');

        const { data, error } = await supabase
            .from('estoque')
            .insert(itemsToInsert)
            .select();

        if (error) {
            console.error('Erro detectado pelo Supabase:', error);
            throw error;
        }

        console.log('Lote salvo com sucesso. Itens:', data?.length);
        res.status(201).json({
            message: 'Itens importados com sucesso',
            count: data?.length,
            data: data
        });
    } catch (error) {
        console.error('CRITICAL: Erro ao salvar itens em lote:', error);
        res.status(500).json({
            error: 'Erro interno ao salvar lote no banco.',
            details: error.message || error.details,
            message: error.message,
            code: error.code || error.statusCode,
            hint: error.hint,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
