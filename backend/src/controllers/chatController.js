const { Chat, ChatMember, User, Message } = require('../models');
const { Op } = require('sequelize');

const getUserChats = async (req, res) => {
  try {
    // Сначала получаем ID чатов где участвует пользователь
    const userChatMembers = await ChatMember.findAll({
      where: { user_id: req.userId },
      attributes: ['chat_id', 'unread_count']
    });

    const chatIds = userChatMembers.map(m => m.chat_id);

    // Затем получаем полные данные этих чатов со ВСЕМИ участниками
    const chats = await Chat.findAll({
      where: { id: { [Op.in]: chatIds } },
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'username', 'avatar_url', 'is_online']
        },
        {
          model: Message,
          as: 'messages',
          limit: 1,
          order: [['created_at', 'DESC']],
          include: [{
            model: User,
            as: 'sender',
            attributes: ['id', 'username']
          }]
        }
      ],
      order: [['last_message_at', 'DESC NULLS LAST']]
    });

    const chatsWithUnread = chats.map(chat => {
      const member = userChatMembers.find(m => m.chat_id === chat.id);
      return {
        ...chat.toJSON(),
        unread_count: member ? member.unread_count : 0
      };
    });

    res.json({ chats: chatsWithUnread });
  } catch (error) {
    console.error('Get user chats error:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
};

const createChat = async (req, res) => {
  try {
    const { user_ids, name, type } = req.body;

    if (!user_ids || user_ids.length === 0) {
      return res.status(400).json({ error: 'User IDs are required' });
    }

    if (type === 'private' && user_ids.length !== 1) {
      return res.status(400).json({ error: 'Private chat requires exactly one other user' });
    }

    if (type === 'private') {
      const existingChat = await Chat.findOne({
        where: { type: 'private' },
        include: [{
          model: User,
          as: 'members',
          where: {
            id: { [Op.in]: [req.userId, user_ids[0]] }
          },
          through: { attributes: [] }
        }]
      });

      if (existingChat && existingChat.members.length === 2) {
        return res.json({ chat: existingChat });
      }
    }

    const chat = await Chat.create({
      name: type === 'group' ? name : null,
      type: type || 'private'
    });

    const members = [req.userId, ...user_ids];
    const chatMembers = members.map((userId, index) => ({
      chat_id: chat.id,
      user_id: userId,
      role: index === 0 ? 'admin' : 'member'
    }));

    await ChatMember.bulkCreate(chatMembers);

    const fullChat = await Chat.findByPk(chat.id, {
      include: [{
        model: User,
        as: 'members',
        attributes: ['id', 'username', 'avatar_url', 'is_online']
      }]
    });

    res.status(201).json({
      message: 'Chat created successfully',
      chat: fullChat
    });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
};

const createSavedMessages = async (req, res) => {
  try {
    const existingChat = await Chat.findOne({
      where: { type: 'private' },
      include: [{
        model: User,
        as: 'members',
        where: {
          id: req.userId
        },
        through: { attributes: [] }
      }]
    });

    if (existingChat && existingChat.members.length === 1) {
      return res.json({ chat: existingChat });
    }

    const chat = await Chat.create({
      name: 'Избранное',
      type: 'private'
    });

    await ChatMember.create({
      chat_id: chat.id,
      user_id: req.userId,
      role: 'admin'
    });

    const fullChat = await Chat.findByPk(chat.id, {
      include: [{
        model: User,
        as: 'members',
        attributes: ['id', 'username', 'avatar_url', 'is_online']
      }]
    });

    res.status(201).json({
      message: 'Saved messages created successfully',
      chat: fullChat
    });
  } catch (error) {
    console.error('Create saved messages error:', error);
    res.status(500).json({ error: 'Failed to create saved messages' });
  }
};

const getChatById = async (req, res) => {
  try {
    const { id } = req.params;

    const chat = await Chat.findByPk(id, {
      include: [{
        model: User,
        as: 'members',
        attributes: ['id', 'username', 'avatar_url', 'is_online', 'last_seen']
      }]
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const isMember = chat.members.some(member => member.id === req.userId);
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this chat' });
    }

    res.json({ chat });
  } catch (error) {
    console.error('Get chat by ID error:', error);
    res.status(500).json({ error: 'Failed to get chat' });
  }
};

const updateChat = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatar_url } = req.body;

    const chat = await Chat.findByPk(id);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const member = await ChatMember.findOne({
      where: { chat_id: id, user_id: req.userId }
    });

    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update chat details' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    await chat.update(updates);

    res.json({
      message: 'Chat updated successfully',
      chat
    });
  } catch (error) {
    console.error('Update chat error:', error);
    res.status(500).json({ error: 'Failed to update chat' });
  }
};

const deleteChat = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await ChatMember.findOne({
      where: { chat_id: id, user_id: req.userId }
    });

    if (!member) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    await member.destroy();

    res.json({ message: 'Left chat successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to leave chat' });
  }
};

const addChatMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    const adminMember = await ChatMember.findOne({
      where: { chat_id: id, user_id: req.userId, role: 'admin' }
    });

    if (!adminMember) {
      return res.status(403).json({ error: 'Only admins can add members' });
    }

    const existingMember = await ChatMember.findOne({
      where: { chat_id: id, user_id }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    await ChatMember.create({
      chat_id: id,
      user_id,
      role: 'member'
    });

    res.json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
};

const removeChatMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const adminMember = await ChatMember.findOne({
      where: { chat_id: id, user_id: req.userId, role: 'admin' }
    });

    if (!adminMember) {
      return res.status(403).json({ error: 'Only admins can remove members' });
    }

    const member = await ChatMember.findOne({
      where: { chat_id: id, user_id: userId }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    await member.destroy();

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

module.exports = {
  getUserChats,
  createChat,
  createSavedMessages,
  getChatById,
  updateChat,
  deleteChat,
  addChatMember,
  removeChatMember
};
