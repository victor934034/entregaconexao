const express = require('express');
const router = express.Router();
const estoqueController = require('../controllers/estoqueController');
const { verificarToken, ehAdmin } = require('../middleware/auth');
const multer = require('multer');

// Usando memoryStorage pois vamos fazer o upload do buffer diretamente para o Supabase
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Rotas de Estoque (necessita ser admin)
router.get('/', verificarToken, ehAdmin, estoqueController.listarEstoque);
router.get('/exportar/pdf', verificarToken, ehAdmin, estoqueController.exportarPdf);
router.get('/:id', verificarToken, ehAdmin, estoqueController.detalhesEstoque);
router.post('/', verificarToken, ehAdmin, upload.single('foto'), estoqueController.criarItemEstoque);
router.put('/:id', verificarToken, ehAdmin, upload.single('foto'), estoqueController.atualizarItemEstoque);
router.delete('/:id', verificarToken, ehAdmin, estoqueController.excluirItemEstoque);

module.exports = router;
