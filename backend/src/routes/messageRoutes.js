const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/auth');
const { messageValidation } = require('../middleware/validation');

router.get('/chats/:id/messages', authMiddleware, messageController.getChatMessages);
router.post('/chats/:id/messages', authMiddleware, messageValidation, messageController.createMessage);
router.put('/:id/read', authMiddleware, messageController.markMessageAsRead);

module.exports = router;
