// Контекст для управления аутентификацией пользователя
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Загрузка данных пользователя при запуске приложения
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных аутентификации:', error);
    } finally {
      setLoading(false);
    }
  };

  // Регистрация нового пользователя
  const register = async (username, email, password, phone) => {
    try {
      const response = await authAPI.register({ username, email, password, phone });
      const { token: newToken, user: newUser } = response.data;

      await AsyncStorage.setItem('authToken', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Ошибка регистрации'
      };
    }
  };

  // Вход пользователя
  const login = async (email, password) => {
    try {
      console.log('AuthContext: login() вызван', email);
      alert('Отправка запроса на сервер...');
      
      // Используем fetch напрямую для совместимости с Safari
      const apiUrl = 'http://10.0.1.9:3000/api/auth/login';
      console.log('Отправка на:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      
      const data = await response.json();
      console.log('AuthContext: ответ получен', data);
      
      const { token: newToken, user: newUser } = data;
      alert('Успех! Сохраняем данные...');

      await AsyncStorage.setItem('authToken', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
      
      alert('Вход выполнен успешно!');

      return { success: true };
    } catch (error) {
      console.error('Ошибка входа:', error);
      alert('ОШИБКА: ' + (error.message || 'Неизвестная ошибка'));
      return {
        success: false,
        error: error.message || 'Неверный email или пароль'
      };
    }
  };

  // Выход пользователя
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Ошибка выхода:', error);
    } finally {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Обновление данных пользователя
  const updateUser = async (updates) => {
    try {
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      console.error('Ошибка обновления пользователя:', error);
      return { success: false, error: 'Ошибка обновления данных' };
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    register,
    login,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
