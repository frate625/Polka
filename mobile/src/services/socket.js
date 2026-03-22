import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Определяем URL в зависимости от того, откуда открыто
const getSocketUrl = () => {
  // Production URL (если установлена переменная окружения)
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }

  if (Platform.OS === 'web') {
    // Проверяем hostname - если localhost, значит на компьютере, иначе на телефоне
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'http://localhost:3000';
    } else {
      // Веб открыто на телефоне по IP - используем тот же IP для Backend
      return 'http://10.0.1.9:3000';
    }
  } else {
    // Для мобильных устройств используем IP компьютера
    return 'http://10.0.1.9:3000';
  }
};

const SOCKET_URL = getSocketUrl();

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  async connect() {
    const token = await AsyncStorage.getItem('authToken');
    
    if (!token) {
      console.log('No auth token found');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
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
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinChat(chatId) {
    if (this.socket) {
      this.socket.emit('join_chat', chatId);
    }
  }

  leaveChat(chatId) {
    if (this.socket) {
      this.socket.emit('leave_chat', chatId);
    }
  }

  sendMessage(chatId, content, type = 'text', fileData = null) {
    if (this.socket) {
      this.socket.emit('send_message', {
        chatId,
        content,
        type,
        ...fileData
      });
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
    if (this.socket) {
      this.socket.on(event, callback);
      
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      
      if (this.listeners.has(event)) {
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
      this.listeners.delete(event);
    }
  }
}

export default new SocketService();
