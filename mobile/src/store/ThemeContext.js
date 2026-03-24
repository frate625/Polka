// Контекст для управления темой (светлая/темная)
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const lightTheme = {
  mode: 'light',
  colors: {
    background: '#F8F9FA',
    secondaryBackground: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1A1A1A',
    secondaryText: '#6B7280',
    border: '#E5E7EB',
    primary: '#5B93FF',
    error: '#EF4444',
    success: '#10B981',
    messageBubble: '#5B93FF',
    ownMessageBubble: '#5B93FF',
    otherMessageBubble: '#F3F4F6',
    ownMessageText: '#FFFFFF',
    otherMessageText: '#1A1A1A',
    inputBackground: '#F3F4F6',
    online: '#10B981',
    shadow: 'rgba(0, 0, 0, 0.08)'
  }
};

export const darkTheme = {
  mode: 'dark',
  colors: {
    background: '#0A0A0A',
    secondaryBackground: '#1C1C1E',
    card: '#1C1C1E',
    text: '#FFFFFF',
    secondaryText: '#9CA3AF',
    border: '#374151',
    primary: '#60A5FA',
    error: '#F87171',
    success: '#34D399',
    messageBubble: '#60A5FA',
    ownMessageBubble: '#60A5FA',
    otherMessageBubble: '#27272A',
    ownMessageText: '#FFFFFF',
    otherMessageText: '#FFFFFF',
    inputBackground: '#27272A',
    online: '#34D399',
    shadow: 'rgba(0, 0, 0, 0.3)'
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
