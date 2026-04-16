import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Определяем URL в зависимости от того, откуда открыто
const getSocketUrl = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      // Production (Vercel)
      if (hostname.includes('vercel.app')) {
        return 'https://polka-production.up.railway.app';
      }
      
      // Localhost
      if (hostname === 'localhost') {
        return 'http://localhost:3000';
      }
      
      // Локальная сеть (IP адрес)
      return 'http://10.0.1.9:3000';
    }
  }
  
  // Для мобильных устройств используем IP компьютера
  return 'http://10.0.1.9:3000';
};

const SOCKET_URL = getSocketUrl();

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.globalHandlers = new Map(); // Глобальные обработчики, которые не удаляются
  }

  async connect() {
    const token = await AsyncStorage.getItem('authToken');
    
    if (!token) {
      console.log('No auth token found');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
    
    // Регистрируем глобальные обработчики сразу при подключении
    this.registerGlobalHandlers();
  }
  
  registerGlobalHandlers() {
    // Эти обработчики работают всегда и вызывают зарегистрированные колбэки
    const events = ['new_message', 'message_edited', 'message_deleted', 'reaction_added', 
                    'user_typing', 'user_stopped_typing', 'message_delivered', 'message_read'];
    
    events.forEach(event => {
      this.socket.on(event, (data) => {
        console.log(`🌐 Global handler received: ${event}`, data);
        // Вызываем все зарегистрированные обработчики для этого события
        const handlers = this.globalHandlers.get(event) || [];
        handlers.forEach(handler => handler(data));
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinChat(chatId) {
    if (this.socket) {
      console.log('📤 Sending join_chat event for chatId:', chatId);
      this.socket.emit('join_chat', chatId);
    } else {
      console.error('❌ Socket not connected, cannot join chat');
    }
  }

  leaveChat(chatId) {
    if (this.socket) {
      this.socket.emit('leave_chat', chatId);
    }
  }

  sendMessage(chatId, content, type = 'text', fileData = null) {
    if (this.socket) {
      console.log('📤 Sending message:', { chatId, type, content: content?.substring(0, 30) });
      this.socket.emit('send_message', {
        chatId,
        content,
        type,
        ...fileData
      });
    } else {
      console.error('❌ Socket not connected, cannot send message');
    }
  }

  startTyping(chatId) {
    if (this.socket) {
      this.socket.emit('typing_start', chatId);
    }
  }

  stopTyping(chatId) {
    if (this.socket) {
      this.socket.emit('typing_stop', chatId);
    }
  }

  markAsRead(chatId, messageId) {
    if (this.socket) {
      this.socket.emit('message_read', { chatId, messageId });
    }
  }

  editMessage(messageId, chatId, content) {
    if (this.socket) {
      this.socket.emit('edit_message', { messageId, chatId, content });
    }
  }

  deleteMessage(messageId, chatId, forEveryone) {
    if (this.socket) {
      console.log('🗑️ Frontend: Отправка delete_message:', { messageId, chatId, forEveryone });
      this.socket.emit('delete_message', { messageId, chatId, forEveryone });
    } else {
      console.error('❌ Socket не подключен!');
    }
  }

  addReaction(messageId, chatId, emoji) {
    if (this.socket) {
      this.socket.emit('add_reaction', { messageId, chatId, emoji });
    }
  }

  on(event, callback) {
    console.log('👂 Registering global handler for event:', event);
    
    if (!this.globalHandlers.has(event)) {
      this.globalHandlers.set(event, []);
    }
    
    // Добавляем в список глобальных обработчиков
    const handlers = this.globalHandlers.get(event);
    if (!handlers.includes(callback)) {
      handlers.push(callback);
      console.log(`✅ Handler registered. Total handlers for ${event}:`, handlers.length);
    }
  }

  off(event, callback) {
    if (this.globalHandlers.has(event)) {
      const handlers = this.globalHandlers.get(event);
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
        console.log(`🗑️ Handler removed for ${event}. Remaining:`, handlers.length);
      }
    }
  }

  removeAllListeners(event) {
    if (this.globalHandlers.has(event)) {
      this.globalHandlers.set(event, []);
      console.log(`🗑️ All handlers removed for event: ${event}`);
    }
  }
}

export default new SocketService();
