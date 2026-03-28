const { Chat, ChatMember, User, Message } = require('../models');
const { Op } = require('sequelize');

const getUserChats = async (req, res) => {
  try {
    // Сначала получаем ID чатов где участвует пользователь и чат не скрыт
    const userChatMembers = await ChatMember.findAll({
      where: { 
        user_id: req.userId,
        is_hidden: false
      },
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
    console.log('🆕 Create chat request:', {
      userId: req.userId,
      body: req.body
    });

    const { user_ids, name, type } = req.body;

    if (!user_ids || user_ids.length === 0) {
      console.log('❌ No user_ids provided');
      return res.status(400).json({ error: 'User IDs are required' });
    }

    if (type === 'private' && user_ids.length !== 1) {
      console.log('❌ Private chat must have exactly 1 user_id, got:', user_ids.length);
      return res.status(400).json({ error: 'Private chat requires exactly one other user' });
    }

    if (type === 'private') {
      console.log('🔍 Checking for existing private chat between:', req.userId, 'and', user_ids[0]);
      
      // Проверяем существующий приватный чат между этими двумя пользователями
      const existingChats = await Chat.findAll({
        where: { type: 'private' },
        include: [{
          model: ChatMember,
          as: 'chatMembers',
          where: {
            user_id: { [Op.in]: [req.userId, user_ids[0]] }
          },
          required: true
        }]
      });

      console.log('📊 Found existing chats:', existingChats.length);

      // Находим чат где участвуют оба пользователя
      const existingChat = existingChats.find(chat => {
        const memberUserIds = chat.chatMembers.map(m => m.user_id);
        return memberUserIds.includes(req.userId) && memberUserIds.includes(user_ids[0]) && memberUserIds.length === 2;
      });

      if (existingChat) {
        console.log('✅ Found existing chat:', existingChat.id);
        
        // Если чат был скрыт у текущего пользователя, делаем его видимым
        const myMember = await ChatMember.findOne({
          where: { chat_id: existingChat.id, user_id: req.userId }
        });

        if (myMember && myMember.is_hidden) {
          console.log('👁️ Unhiding chat for user');
          await myMember.update({ is_hidden: false });
        }

        // Возвращаем полный чат с участниками
        const fullChat = await Chat.findByPk(existingChat.id, {
          include: [{
            model: User,
            as: 'members',
            attributes: ['id', 'username', 'avatar_url', 'is_online']
          }]
        });

        console.log('📤 Returning existing chat');
        return res.json({ chat: fullChat });
      }
    }

    console.log('🆕 Creating new chat:', { name, type });
    
    const chat = await Chat.create({
      name: type === 'group' ? name : null,
      type: type || 'private',
      owner_id: type === 'group' ? req.userId : null
    });

    console.log('✅ Chat created with ID:', chat.id);

    const members = [req.userId, ...user_ids];
    console.log('👥 Adding members:', members);
    
    const chatMembers = members.map((userId, index) => ({
      chat_id: chat.id,
      user_id: userId,
      role: index === 0 ? 'admin' : 'member'
    }));

    await ChatMember.bulkCreate(chatMembers);
    console.log('✅ ChatMembers created');

    const fullChat = await Chat.findByPk(chat.id, {
      include: [{
        model: User,
        as: 'members',
        attributes: ['id', 'username', 'avatar_url', 'is_online']
      }]
    });

    console.log('✅ Returning new chat with', fullChat.members?.length, 'members');

    res.status(201).json({
      message: 'Chat created successfully',
      chat: fullChat
    });
  } catch (error) {
    console.error('❌ Create chat error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Failed to create chat',
      details: error.message 
    });
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

    // Для групповых чатов только владелец может обновлять
    if (chat.type === 'group' && chat.owner_id !== req.userId) {
      return res.status(403).json({ error: 'Only group owner can update chat details' });
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
    const { forEveryone } = req.body; // true = удалить для всех, false = только у себя

    const chat = await Chat.findByPk(id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const member = await ChatMember.findOne({
      where: { chat_id: id, user_id: req.userId }
    });

    if (!member) {
      return res.status(404).json({ error: 'You are not a member of this chat' });
    }

    if (forEveryone) {
      // Удаление для всех - только для приватных чатов
      if (chat.type === 'private') {
        // Удаляем все сообщения
        await Message.destroy({ where: { chat_id: id } });
        // Удаляем всех участников
        await ChatMember.destroy({ where: { chat_id: id } });
        // Удаляем сам чат
        await chat.destroy();
        
        res.json({ message: 'Chat deleted for everyone' });
      } else {
        return res.status(400).json({ error: 'Cannot delete group chats for everyone. Leave the group instead.' });
      }
    } else {
      // Удаление только у себя - скрываем чат
      await member.update({ is_hidden: true });
      
      res.json({ message: 'Chat hidden successfully' });
    }
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
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

    // Проверяем что запрашивающий является владельцем группы
    const chat = await Chat.findByPk(id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (chat.owner_id !== req.userId) {
      return res.status(403).json({ error: 'Only group owner can remove members' });
    }

    const member = await ChatMember.findOne({
      where: { chat_id: id, user_id: userId }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Владелец не может удалить сам себя
    if (userId === req.userId) {
      return res.status(400).json({ error: 'Owner cannot remove themselves. Use leave group instead.' });
    }

    await member.destroy();

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const chat = await Chat.findByPk(id);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (chat.type !== 'group') {
      return res.status(400).json({ error: 'Can only leave group chats' });
    }

    const member = await ChatMember.findOne({
      where: { chat_id: id, user_id: req.userId }
    });

    if (!member) {
      return res.status(404).json({ error: 'You are not a member of this group' });
    }

    // Если это владелец группы, нужно передать права другому участнику
    if (chat.owner_id === req.userId) {
      const newOwner = await ChatMember.findOne({
        where: { 
          chat_id: id,
          user_id: { [Op.ne]: req.userId }
        },
        order: [['joined_at', 'ASC']]
      });

      if (newOwner) {
        await chat.update({ owner_id: newOwner.user_id });
        await newOwner.update({ role: 'admin' });
      }
    }

    await member.destroy();

    res.json({ message: 'Left group successfully' });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ error: 'Failed to leave group' });
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
  removeChatMember,
  leaveGroup
};
