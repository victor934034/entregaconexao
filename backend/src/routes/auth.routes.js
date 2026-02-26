const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/test', (req, res) => res.json({ message: 'Auth routes mounted' }));
router.post('/login', authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);
router.put('/alterar-senha', authMiddleware, authController.alterarSenha);

module.exports = router;
