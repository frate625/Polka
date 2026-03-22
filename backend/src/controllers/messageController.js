const { Message, User, ChatMember, Chat } = require('../models');

const getChatMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const isMember = await ChatMember.findOne({
      where: { chat_id: id, user_id: req.userId }
    });

    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this chat' });
    }

    const messages = await Message.findAll({
      where: { chat_id: id },
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'username', 'avatar_url']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

const createMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, type = 'text', file_url, file_name, file_size } = req.body;

    const isMember = await ChatMember.findOne({
      where: { chat_id: id, user_id: req.userId }
    });

    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this chat' });
    }

    const message = await Message.create({
      chat_id: id,
      sender_id: req.userId,
      content,
      type,
      file_url,
      file_name,
      file_size,
      status: 'sent'
    });

    await Chat.update(
      { last_message_at: new Date() },
      { where: { id } }
    );

    await ChatMember.increment('unread_count', {
      where: {
        chat_id: id,
        user_id: { [require('sequelize').Op.ne]: req.userId }
      }
    });

    const fullMessage = await Message.findByPk(message.id, {
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'username', 'avatar_url']
      }]
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: fullMessage
    });
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

const markMessageAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findByPk(id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const isMember = await ChatMember.findOne({
      where: { chat_id: message.chat_id, user_id: req.userId }
    });

    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this chat' });
    }

    await ChatMember.update(
      { unread_count: 0 },
      { where: { chat_id: message.chat_id, user_id: req.userId } }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
};

module.exports = {
  getChatMessages,
  createMessage,
  markMessageAsRead
};
