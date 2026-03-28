// Экран для создания нового чата или группы
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { userAPI, chatAPI } from '../services/api';

export default function CreateChatScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Поиск пользователей
  const searchUsers = async (query) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await userAPI.searchUsers(query);
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error('Ошибка поиска пользователей:', error);
    } finally {
      setLoading(false);
    }
  };

  // Создание приватного чата с пользователем
  const createPrivateChat = async (userId) => {
    console.log('🆕 Creating private chat with userId:', userId);
    try {
      setLoading(true);
      const response = await chatAPI.createChat({
        user_ids: [userId],
        type: 'private'
      });

      console.log('✅ Chat created:', response.data);

      if (response.data.chat) {
        const user = searchResults.find(u => u.id === userId);
        const chatName = user?.username || 'Чат';
        
        console.log('📱 Navigating to chat:', {
          chatId: response.data.chat.id,
          chatName,
          chatType: 'private'
        });
        
        navigation.navigate('Chat', {
          chatId: response.data.chat.id,
          chatName,
          chatType: 'private',
          chatMembers: response.data.chat.members
        });
      } else {
        console.error('❌ No chat in response');
        const errorMsg = 'Не удалось создать чат: нет данных';
        if (Platform.OS === 'web') {
          alert(errorMsg);
        } else {
          Alert.alert('Ошибка', errorMsg);
        }
      }
    } catch (error) {
      console.error('❌ Ошибка создания чата:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMsg = error.response?.data?.error || 'Не удалось создать чат';
      if (Platform.OS === 'web') {
        alert('Ошибка: ' + errorMsg);
      } else {
        Alert.alert('Ошибка', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Переход к созданию группы
  const goToCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };

  // Рендер элемента пользователя
  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => createPrivateChat(item.id)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.username[0]?.toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        {item.status && (
          <Text style={styles.userStatus} numberOfLines={1}>
            {item.status}
          </Text>
        )}
      </View>
      {item.is_online && <View style={styles.onlineIndicator} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.createGroupButton} onPress={goToCreateGroup}>
        <Text style={styles.createGroupText}>Создать группу</Text>
      </TouchableOpacity>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск пользователей..."
          value={searchQuery}
          onChangeText={searchUsers}
          autoCapitalize="none"
        />
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Поиск...</Text>
        </View>
      )}

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        ListEmptyComponent={
          searchQuery.length >= 2 && !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Пользователи не найдены</Text>
            </View>
          ) : searchQuery.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Введите имя или email для поиска
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  createGroupButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  createGroupText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  searchContainer: {
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
  loadingContainer: {
    padding: 20,
    alignItems: 'center'
  },
  loadingText: {
    color: '#666',
    fontSize: 14
  },
  userItem: {
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
  userInfo: {
    flex: 1
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2
  },
  userStatus: {
    fontSize: 12,
    color: '#999'
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4cd964',
    marginLeft: 8
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center'
  }
});
