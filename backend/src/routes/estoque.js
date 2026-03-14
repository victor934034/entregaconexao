const express = require('express');
const router = express.Router();
const estoqueController = require('../controllers/estoqueController');
const authMiddleware = require('../middleware/auth.middleware');
const permissionMiddleware = require('../middleware/permission.middleware');
const multer = require('multer');

// Usando memoryStorage pois vamos fazer o upload do buffer diretamente para o Supabase
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Rotas de Estoque (necessita ser admin/permissão)
router.get('/', authMiddleware, permissionMiddleware('visualizar_estoque'), estoqueController.listarEstoque);
router.get('/exportar/pdf', authMiddleware, permissionMiddleware('exportar_estoque_pdf'), estoqueController.exportarPdf);
router.get('/:id', authMiddleware, permissionMiddleware('visualizar_estoque'), estoqueController.detalhesEstoque);
router.post('/', authMiddleware, permissionMiddleware('criar_item_estoque'), upload.single('foto'), estoqueController.criarItemEstoque);
router.put('/:id', authMiddleware, permissionMiddleware('editar_item_estoque'), upload.single('foto'), estoqueController.atualizarItemEstoque);
router.delete('/:id', authMiddleware, permissionMiddleware('excluir_item_estoque'), estoqueController.excluirItemEstoque);

module.exports = router;
