// Контекст для управления темой (светлая/темная)
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const lightTheme = {
  mode: 'light',
  colors: {
    background: '#FFFFFF',
    secondaryBackground: '#F5F5F5',
    card: '#FFFFFF',
    text: '#000000',
    secondaryText: '#666666',
    border: '#E0E0E0',
    primary: '#007AFF',
    error: '#FF3B30',
    success: '#4CD964',
    messageBubble: '#007AFF',
    ownMessageBubble: '#007AFF',
    otherMessageBubble: '#FFFFFF',
    ownMessageText: '#FFFFFF',
    otherMessageText: '#000000',
    inputBackground: '#F5F5F5',
    online: '#4CD964'
  }
};

export const darkTheme = {
  mode: 'dark',
  colors: {
    background: '#000000',
    secondaryBackground: '#1C1C1E',
    card: '#1C1C1E',
    text: '#FFFFFF',
    secondaryText: '#A0A0A0',
    border: '#3A3A3C',
    primary: '#0A84FF',
    error: '#FF453A',
    success: '#32D74B',
    messageBubble: '#0A84FF',
    ownMessageBubble: '#0A84FF',
    otherMessageBubble: '#2C2C2E',
    ownMessageText: '#FFFFFF',
    otherMessageText: '#FFFFFF',
    inputBackground: '#2C2C2E',
    online: '#32D74B'
  }
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('auto'); // 'auto', 'light', 'dark'
  const [theme, setTheme] = useState(lightTheme);

  // Загрузка сохраненной темы при запуске
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Обновление темы при изменении режима или системной темы
  useEffect(() => {
    updateTheme();
  }, [themeMode, systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem('theme_mode');
      if (saved) {
        setThemeMode(saved);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  };

  const updateTheme = () => {
    let isDark = false;

    if (themeMode === 'auto') {
      isDark = systemColorScheme === 'dark';
    } else if (themeMode === 'dark') {
      isDark = true;
    }

    setTheme(isDark ? darkTheme : lightTheme);
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
  };

  const changeThemeMode = async (mode) => {
    setThemeMode(mode);
    try {
      await AsyncStorage.setItem('theme_mode', mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const value = {
    theme,
    themeMode,
    setThemeMode: changeThemeMode,
    isDark: theme.mode === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
