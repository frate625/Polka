const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, chatController.getUserChats);
router.post('/saved-messages', authMiddleware, chatController.createSavedMessages);
router.post('/', authMiddleware, chatController.createChat);
router.get('/:id', authMiddleware, chatController.getChatById);
router.put('/:id', authMiddleware, chatController.updateChat);
router.delete('/:id', authMiddleware, chatController.deleteChat);
router.post('/:id/members', authMiddleware, chatController.addChatMember);
router.delete('/:id/members/:userId', authMiddleware, chatController.removeChatMember);

module.exports = router;
