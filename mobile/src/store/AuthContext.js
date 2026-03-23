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
      const response = await authAPI.login({ email, password });
      const { token: newToken, user: newUser } = response.data;

      await AsyncStorage.setItem('authToken', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      console.error('Ошибка входа:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Неверный email или пароль'
      };
    }
  };

  // Выход пользователя
  const logout = async () => {
    try {
      console.log('🚪 Logout: начало процесса выхода');
      // Пытаемся вызвать API logout (но не критично если упадёт)
      try {
        await authAPI.logout();
        console.log('✅ Logout: API logout успешно');
      } catch (apiError) {
        console.warn('⚠️ Logout: API logout не удался, но продолжаем:', apiError.message);
      }
      
      // Очищаем локальные данные (это важно!)
      console.log('🗑️ Logout: очистка AsyncStorage');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      
      // Обновляем состояние
      console.log('📝 Logout: обновление состояния');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('✅ Logout: завершено успешно');
    } catch (error) {
      console.error('❌ Logout: критическая ошибка:', error);
      // Даже если что-то пошло не так, пытаемся очистить
      try {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } catch (cleanupError) {
        console.error('❌ Logout: ошибка при очистке:', cleanupError);
      }
      throw error; // Пробрасываем ошибку, чтобы UI знал
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
