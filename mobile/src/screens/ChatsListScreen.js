// Экран со списком всех чатов пользователя
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { chatAPI } from '../services/api';
import { useSocket } from '../store/SocketContext';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import ChatItem from '../components/ChatItem';

export default function ChatsListScreen() {
  const navigation = useNavigation();
  const { socket } = useSocket();
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Настройка header с кнопкой поиска
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: 15 }}
          onPress={() => navigation.navigate('Search')}
        >
          <Text style={{ fontSize: 20 }}>🔍</Text>
        </TouchableOpacity>
      )
    });
  }, []);

  // Загрузка чатов при фокусе на экране
  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [])
  );

  // Подписка на события WebSocket
  useEffect(() => {
    // Обновление при получении нового сообщения
    socket.on('new_message', (message) => {
      updateChatWithNewMessage(message);
    });

    return () => {
      socket.removeAllListeners('new_message');
    };
  }, [chats]);

  // Загрузка списка чатов
  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getChats();
      const allChats = response.data.chats || [];
      
      // Фильтруем "Избранное" (чаты где единственный участник - сам пользователь)
      const filteredChats = allChats.filter(chat => {
        if (chat.type === 'group') return true;
        
        if (chat.type === 'private' && chat.members) {
          // Скрываем "Избранное" - чаты с единственным участником (самим собой)
          // или где нет других участников кроме currentUser
          const otherMembers = chat.members.filter(m => m.id !== currentUser?.id);
          
          // Если нет других участников - это "Избранное", скрываем
          if (otherMembers.length === 0) {
            return false;
          }
        }
        
        return true;
      });
      
      setChats(filteredChats);
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить чаты');
    } finally {
      setLoading(false);
    }
  };

  // Обновление чата при получении нового сообщения
  const updateChatWithNewMessage = (message) => {
    setChats((prevChats) => {
      const updatedChats = prevChats.map((chat) => {
        if (chat.id === message.chat_id) {
          return {
            ...chat,
            messages: [message],
            last_message_at: message.created_at,
            unread_count: (chat.unread_count || 0) + 1
          };
        }
        return chat;
      });
      // Сортировка по времени последнего сообщения
      return updatedChats.sort((a, b) =>
        new Date(b.last_message_at) - new Date(a.last_message_at)
      );
    });
  };

  // Обновление списка свайпом вниз
  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  // Открытие чата
  const openChat = (chat) => {
    const chatName = chat.type === 'group'
      ? chat.name
      : chat.members?.find(m => m.id !== currentUser?.id)?.username || 'Чат';

    navigation.navigate('Chat', {
      chatId: chat.id,
      chatName,
      chatType: chat.type,
      chatMembers: chat.members
    });
  };

  // Переход к созданию нового чата
  const createNewChat = () => {
    navigation.navigate('CreateChat');
  };

  // Открытие или создание избранного
  const openSavedMessages = async () => {
    try {
      const response = await chatAPI.createSavedMessages();
      const savedChat = response.data.chat;
      
      navigation.navigate('Chat', {
        chatId: savedChat.id,
        chatName: '⭐ Избранное',
        chatType: 'private'
      });
    } catch (error) {
      console.error('Ошибка создания избранного:', error);
      Alert.alert('Ошибка', 'Не удалось открыть избранное');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatItem chat={item} currentUser={currentUser} onPress={() => openChat(item)} theme={theme} />
        )}
        ListHeaderComponent={
          <TouchableOpacity style={[styles.savedMessagesButton, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]} onPress={openSavedMessages}>
            <View style={[styles.savedMessagesIcon, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.savedMessagesIconText}>⭐</Text>
            </View>
            <View style={styles.savedMessagesContent}>
              <Text style={[styles.savedMessagesTitle, { color: theme.colors.text }]}>Избранное</Text>
              <Text style={[styles.savedMessagesSubtitle, { color: theme.colors.secondaryText }]}>Сохраненные сообщения</Text>
            </View>
          </TouchableOpacity>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              {loading ? 'Загрузка...' : 'Нет чатов'}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.secondaryText }]}>
              Начните новый чат с помощью кнопки ниже
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={createNewChat}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  savedMessagesButton: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    alignItems: 'center'
  },
  savedMessagesIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  savedMessagesIconText: {
    fontSize: 24
  },
  savedMessagesContent: {
    flex: 1
  },
  savedMessagesTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2
  },
  savedMessagesSubtitle: {
    fontSize: 14,
    color: '#8E8E93'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center'
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300'
  }
});
