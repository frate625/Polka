const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

router.get('/me', authMiddleware, userController.getCurrentUser);
router.put('/me', authMiddleware, userController.updateProfile);
router.get('/search', authMiddleware, userController.searchUsers);
router.get('/:id', authMiddleware, userController.getUserById);

module.exports = router;
