const { Message, User, ChatMember, Chat } = require('../models');
const { verifyToken } = require('../utils/jwt');
const redisClient = require('../config/redis');

module.exports = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return next(new Error('Invalid token'));
      }

      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password_hash'] }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Подключаем пользователя к его личной комнате для звонков и уведомлений
    socket.join(`user_${socket.userId}`);
    console.log(`User ${socket.userId} joined personal room: user_${socket.userId}`);

    await User.update(
      { is_online: true, last_seen: new Date() },
      { where: { id: socket.userId } }
    );

    try {
      if (redisClient.isOpen) {
        await redisClient.set(`user:${socket.userId}:socket`, socket.id);
      }
    } catch (error) {
      console.log('Redis not available for storing socket ID');
    }

    socket.broadcast.emit('user_online', {
      userId: socket.userId,
      username: socket.user.username
    });

    socket.on('join_chat', async (chatId) => {
      try {
        console.log(`📥 User ${socket.userId} requesting to join chat ${chatId}`);
        const isMember = await ChatMember.findOne({
          where: { chat_id: chatId, user_id: socket.userId }
        });

        if (isMember) {
          socket.join(`chat_${chatId}`);
          socket.currentChat = chatId;
          console.log(`✅ User ${socket.userId} (${socket.user.username}) joined room: chat_${chatId}`);
          
          // Сбрасываем непрочитанные для этого юзера
          socket.emit('message_read', { chatId });
        } else {
          console.log(`❌ User ${socket.userId} is not a member of chat ${chatId}`);
        }
      } catch (error) {
        console.error('Join chat error:', error);
      }
    });

    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat_${chatId}`);
      if (socket.currentChat === chatId) {
        socket.currentChat = null;
      }
      console.log(`User ${socket.userId} left chat ${chatId}`);
    });

    socket.on('send_message', async (data) => {
      try {
        const { chatId, content, type = 'text', file_url, file_name, file_size, reply_to } = data;

        console.log('📨 Получено сообщение:', { chatId, type, file_url, content: content?.substring(0, 50) });

        const isMember = await ChatMember.findOne({
          where: { chat_id: chatId, user_id: socket.userId }
        });

        if (!isMember) {
          return socket.emit('error', { message: 'Not a member of this chat' });
        }

        // Проверка для файловых типов
        if (['image', 'voice', 'video', 'video_note', 'file'].includes(type) && !file_url) {
          console.error('❌ Отсутствует file_url для типа:', type);
          return socket.emit('error', { message: 'file_url is required for this message type' });
        }

        const message = await Message.create({
          chat_id: chatId,
          sender_id: socket.userId,
          content,
          type,
          file_url,
          file_name,
          file_size,
          reply_to_id: reply_to || null,
          status: 'sent'
        });

        // Параллельные запросы для ускорения
        await Promise.all([
          Chat.update(
            { last_message_at: new Date() },
            { where: { id: chatId } }
          ),
          ChatMember.increment('unread_count', {
            where: {
              chat_id: chatId,
              user_id: { [require('sequelize').Op.ne]: socket.userId }
            }
          })
        ]);

        // Отправляем сообщение сразу с базовыми данными
        const quickMessage = {
          ...message.toJSON(),
          sender: {
            id: socket.user.id,
            username: socket.user.username,
            avatar_url: socket.user.avatar_url
          }
        };

        // Если есть reply_to, подгружаем его асинхронно
        if (reply_to) {
          Message.findByPk(reply_to, {
            attributes: ['id', 'content', 'type', 'file_url'],
            include: [{
              model: User,
              as: 'sender',
              attributes: ['id', 'username']
            }]
          }).then(replyMsg => {
            quickMessage.reply_to = replyMsg;
            console.log(`📤 Emitting new_message to room chat_${chatId}:`, { messageId: quickMessage.id, sender: socket.user.username });
            io.to(`chat_${chatId}`).emit('new_message', quickMessage);
          });
        } else {
          // Отправляем сразу без ожидания
          const roomName = `chat_${chatId}`;
          const socketsInRoom = io.sockets.adapter.rooms.get(roomName);
          console.log(`📤 Emitting new_message to room ${roomName}:`, { 
            messageId: quickMessage.id, 
            sender: socket.user.username, 
            chatId: quickMessage.chat_id,
            socketsInRoom: socketsInRoom ? Array.from(socketsInRoom) : []
          });
          io.to(roomName).emit('new_message', quickMessage);
        }

        socket.to(`chat_${chatId}`).emit('message_delivered', {
          messageId: message.id,
          chatId
        });

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing_start', (chatId) => {
      socket.to(`chat_${chatId}`).emit('user_typing', {
        userId: socket.userId,
        username: socket.user.username,
        chatId
      });
    });

    socket.on('typing_stop', (chatId) => {
      socket.to(`chat_${chatId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        chatId
      });
    });

    socket.on('message_read', async (data) => {
      try {
        const { chatId, messageId } = data;

        await ChatMember.update(
          { unread_count: 0 },
          { where: { chat_id: chatId, user_id: socket.userId } }
        );

        socket.to(`chat_${chatId}`).emit('message_read', {
          messageId,
          chatId,
          userId: socket.userId
        });

      } catch (error) {
        console.error('Message read error:', error);
      }
    });

    socket.on('edit_message', async (data) => {
      try {
        const { messageId, chatId, content } = data;

        const message = await Message.findOne({
          where: { id: messageId, sender_id: socket.userId }
        });

        if (!message) {
          return socket.emit('error', { message: 'Message not found or not yours' });
        }

        const messageAge = Date.now() - new Date(message.created_at).getTime();
        if (messageAge > 48 * 60 * 60 * 1000) {
          return socket.emit('error', { message: 'Cannot edit messages older than 48 hours' });
        }

        await message.update({ content });

        io.to(`chat_${chatId}`).emit('message_edited', {
          messageId,
          chatId,
          content
        });

      } catch (error) {
        console.error('Edit message error:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    socket.on('delete_message', async (data) => {
      try {
        console.log('🗑️ Delete message request:', data);
        const { messageId, chatId, forEveryone } = data;

        const message = await Message.findOne({
          where: { id: messageId }
        });

        if (!message) {
          console.log('❌ Message not found:', messageId);
          return socket.emit('error', { message: 'Message not found' });
        }

        console.log('✅ Message found:', { id: message.id, sender: message.sender_id, userId: socket.userId });

        if (forEveryone && message.sender_id !== socket.userId) {
          console.log('❌ Cannot delete others messages for everyone');
          return socket.emit('error', { message: 'Cannot delete others messages for everyone' });
        }

        if (forEveryone) {
          await message.destroy();
          console.log('✅ Message deleted for everyone');
          io.to(`chat_${chatId}`).emit('message_deleted', {
            messageId,
            chatId
          });
        } else {
          console.log('✅ Message deleted for user only');
          socket.emit('message_deleted', {
            messageId,
            chatId
          });
        }

      } catch (error) {
        console.error('❌ Delete message error:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    socket.on('add_reaction', async (data) => {
      try {
        const { messageId, chatId, emoji } = data;

        io.to(`chat_${chatId}`).emit('reaction_added', {
          messageId,
          chatId,
          userId: socket.userId,
          username: socket.user.username,
          emoji
        });

      } catch (error) {
        console.error('Add reaction error:', error);
      }
    });

    // ===== ЗВОНКИ =====
    
    // Инициация звонка
    socket.on('call_initiate', async (data) => {
      try {
        const { callId, chatId, recipientId, callerId, isVideo, offer } = data;
        console.log(`📞 Звонок инициирован: ${callerId} → ${recipientId} (${isVideo ? 'видео' : 'аудио'})`);

        // Отправляем получателю
        io.to(`user_${recipientId}`).emit('incoming_call', {
          callId,
          chatId,
          callerId,
          callerName: socket.user.username,
          isVideo,
          offer
        });
      } catch (error) {
        console.error('Call initiate error:', error);
      }
    });

    // Ответ на звонок
    socket.on('call_answer', async (data) => {
      try {
        const { callId, answer } = data;
        console.log(`✅ Звонок принят: ${callId}`);

        // Извлекаем callerId из callId
        const [callerId] = callId.split('_');
        
        // Отправляем инициатору
        io.to(`user_${callerId}`).emit('call_answered', {
          callId,
          answer
        });
      } catch (error) {
        console.error('Call answer error:', error);
      }
    });

    // ICE candidate
    socket.on('ice_candidate', (data) => {
      const { callId, candidate } = data;
      
      // Определяем получателя из callId
      const [callerId, recipientId] = callId.split('_');
      const targetId = socket.userId === callerId ? recipientId : callerId;
      
      io.to(`user_${targetId}`).emit('ice_candidate', {
        callId,
        candidate
      });
    });

    // Завершение звонка
    socket.on('call_end', (data) => {
      const { callId } = data;
      console.log(`📵 Звонок завершен: ${callId}`);
      
      // Определяем получателя
      const [callerId, recipientId] = callId.split('_');
      const targetId = socket.userId === callerId ? recipientId : callerId;
      
      io.to(`user_${targetId}`).emit('call_ended', { callId });
    });

    // Отклонение звонка
    socket.on('call_decline', (data) => {
      const { callId } = data;
      console.log(`❌ Звонок отклонен: ${callId}`);
      
      // Определяем инициатора
      const [callerId] = callId.split('_');
      
      io.to(`user_${callerId}`).emit('call_declined', { callId });
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);

      await User.update(
        { is_online: false, last_seen: new Date() },
        { where: { id: socket.userId } }
      );

      try {
        if (redisClient.isOpen) {
          await redisClient.del(`user:${socket.userId}:socket`);
        }
      } catch (error) {
        console.log('Redis not available for deleting socket ID');
      }

      socket.broadcast.emit('user_offline', {
        userId: socket.userId,
        username: socket.user.username
      });
    });
  });
};
