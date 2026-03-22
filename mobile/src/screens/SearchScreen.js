// Экран поиска по чатам и сообщениям
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { chatAPI, messageAPI } from '../services/api';
import { useAuth } from '../store/AuthContext';

export default function SearchScreen() {
  const navigation = useNavigation();
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState('chats'); // 'chats' или 'messages'
  const [chatsResults, setChatsResults] = useState([]);
  const [messagesResults, setMessagesResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Поиск
  const handleSearch = async (text) => {
    setQuery(text);

    if (text.length < 2) {
      setChatsResults([]);
      setMessagesResults([]);
      return;
    }

    setLoading(true);

    try {
      if (searchMode === 'chats') {
        const response = await chatAPI.getChats();
        const allChats = response.data.chats || [];
        
        const filtered = allChats.filter(chat => {
          const searchLower = text.toLowerCase();
          const chatName = chat.name?.toLowerCase() || '';
          const isSaved = chat.type === 'private' && chat.members?.length === 1 && chatName.includes('избран');
          
          return chatName.includes(searchLower) ||
                 (isSaved && ('избранное'.includes(searchLower) || searchLower.includes('избран'))) ||
                 chat.members?.some(m => m.username.toLowerCase().includes(searchLower));
        });
        
        setChatsResults(filtered);
      } else {
        // Поиск по сообщениям - нужно будет добавить endpoint на backend
        // Пока просто заглушка
        setMessagesResults([]);
      }
    } catch (error) {
      console.error('Ошибка поиска:', error);
    } finally {
      setLoading(false);
    }
  };

  // Открыть чат
  const openChat = (chat) => {
    const otherMember = chat.type === 'private' 
      ? chat.members?.find(m => m.id !== currentUser?.id)
      : null;
    
    const name = chat.type === 'group'
      ? chat.name
      : (otherMember?.username || 'Чат');

    navigation.navigate('Chat', {
      chatId: chat.id,
      chatName: name,
      chatType: chat.type,
      chatMembers: chat.members
    });
  };

  // Рендер чата
  const renderChatItem = ({ item }) => {
    const otherMember = item.type === 'private' 
      ? item.members?.find(m => m.id !== currentUser?.id)
      : null;
    
    const displayName = item.type === 'group' 
      ? item.name 
      : (otherMember?.username || 'Чат');
    
    return (
      <TouchableOpacity style={styles.chatItem} onPress={() => openChat(item)}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {displayName[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>
            {displayName}
          </Text>
          {item.messages?.[0] && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.messages[0].content || 'Медиа'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск..."
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoFocus
        />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, searchMode === 'chats' && styles.tabActive]}
          onPress={() => setSearchMode('chats')}
        >
          <Text style={[styles.tabText, searchMode === 'chats' && styles.tabTextActive]}>
            Чаты
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, searchMode === 'messages' && styles.tabActive]}
          onPress={() => setSearchMode('messages')}
        >
          <Text style={[styles.tabText, searchMode === 'messages' && styles.tabTextActive]}>
            Сообщения
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={searchMode === 'chats' ? chatsResults : messagesResults}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          ListEmptyComponent={
            query.length >= 2 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Ничего не найдено</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Введите запрос для поиска</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  searchHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 10,
    fontSize: 16
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabActive: {
    borderBottomColor: '#007AFF'
  },
  tabText: {
    fontSize: 15,
    color: '#666'
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center'
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600'
  },
  chatInfo: {
    flex: 1
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4
  },
  lastMessage: {
    fontSize: 14,
    color: '#666'
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: '#999'
  }
});
