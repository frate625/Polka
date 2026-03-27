// Экран выбора темы для конкретного чата
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../store/ThemeContext';

const CHAT_THEMES = [
  {
    id: 'default',
    name: 'По умолчанию',
    emoji: '⚪',
    colors: {
      light: { bg: '#F5F5F5', pattern: 'rgba(210,180,140,0.15)' },
      dark: { bg: '#1C1C1E', pattern: 'rgba(255,255,255,0.05)' }
    }
  },
  {
    id: 'friendship',
    name: 'Дружба',
    emoji: '🌈',
    colors: {
      light: { bg: '#FFF8DC', pattern: 'rgba(255,200,100,0.2)' },
      dark: { bg: '#2C2416', pattern: 'rgba(255,215,0,0.1)' }
    }
  },
  {
    id: 'love',
    name: 'Любовь',
    emoji: '💕',
    colors: {
      light: { bg: '#FFE4E9', pattern: 'rgba(255,105,180,0.15)' },
      dark: { bg: '#2D1F23', pattern: 'rgba(255,182,193,0.1)' }
    }
  },
  {
    id: 'work',
    name: 'Работа',
    emoji: '💼',
    colors: {
      light: { bg: '#E8F4F8', pattern: 'rgba(70,130,180,0.1)' },
      dark: { bg: '#1A2633', pattern: 'rgba(135,206,235,0.08)' }
    }
  },
  {
    id: 'gaming',
    name: 'Игры',
    emoji: '🎮',
    colors: {
      light: { bg: '#F0E6FF', pattern: 'rgba(138,43,226,0.12)' },
      dark: { bg: '#261E33', pattern: 'rgba(186,85,211,0.1)' }
    }
  },
  {
    id: 'nature',
    name: 'Природа',
    emoji: '🌿',
    colors: {
      light: { bg: '#E8F5E9', pattern: 'rgba(34,139,34,0.12)' },
      dark: { bg: '#1B2E1F', pattern: 'rgba(144,238,144,0.08)' }
    }
  }
];

export default function ChatThemeScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId, chatName } = route.params;
  const { theme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState('default');

  useEffect(() => {
    loadChatTheme();
  }, [chatId]);

  const loadChatTheme = async () => {
    try {
      const key = `chat_theme_${chatId}`;
      const saved = await AsyncStorage.getItem(key);
      if (saved) {
        setSelectedTheme(saved);
      }
    } catch (error) {
      console.error('Ошибка загрузки темы чата:', error);
    }
  };

  const saveChatTheme = async (themeId) => {
    try {
      const key = `chat_theme_${chatId}`;
      await AsyncStorage.setItem(key, themeId);
      setSelectedTheme(themeId);
      Alert.alert('Успех', 'Тема чата изменена');
      // Отправляем событие для обновления ChatScreen
      if (global.chatThemeUpdateCallback) {
        global.chatThemeUpdateCallback(chatId, themeId);
      }
    } catch (error) {
      console.error('Ошибка сохранения темы чата:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить тему');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{chatName}</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.secondaryText }]}>
          Выберите тему оформления чата
        </Text>
      </View>

      <View style={styles.themesContainer}>
        {CHAT_THEMES.map((chatTheme) => {
          const isSelected = selectedTheme === chatTheme.id;
          const isDark = theme.name === 'dark';
          const themeColors = isDark ? chatTheme.colors.dark : chatTheme.colors.light;
          
          return (
            <TouchableOpacity
              key={chatTheme.id}
              style={[
                styles.themeCard,
                { 
                  backgroundColor: theme.colors.card,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border
                },
                isSelected && styles.themeCardSelected
              ]}
              onPress={() => saveChatTheme(chatTheme.id)}
            >
              <View style={[styles.themePreview, { backgroundColor: themeColors.bg }]}>
                <Text style={styles.themeEmoji}>{chatTheme.emoji}</Text>
              </View>
              <Text style={[styles.themeName, { color: theme.colors.text }]}>
                {chatTheme.name}
              </Text>
              {isSelected && (
                <View style={[styles.selectedBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.selectedText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

export { CHAT_THEMES };

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    padding: 20,
    marginBottom: 16
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8
  },
  headerSubtitle: {
    fontSize: 14
  },
  themesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8
  },
  themeCard: {
    width: '47%',
    margin: '1.5%',
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    alignItems: 'center'
  },
  themeCardSelected: {
    borderWidth: 3
  },
  themePreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  themeEmoji: {
    fontSize: 40
  },
  themeName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  selectedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  }
});
