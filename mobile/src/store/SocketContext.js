// Контекст для управления WebSocket соединением
import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socket';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  // Подключение/отключение сокета при изменении статуса аутентификации
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Подключение к WebSocket...');
      socketService.connect();
    } else {
      console.log('Отключение от WebSocket...');
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, user]);

  const value = {
    socket: socketService
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
