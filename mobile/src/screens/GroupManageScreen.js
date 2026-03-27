// Экран управления группой (добавление/удаление участников)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { userAPI, chatAPI } from '../services/api';
import { useAuth } from '../store/AuthContext';

export default function GroupManageScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId, currentMembers = [] } = route.params;
  const { user: currentUser } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [members, setMembers] = useState(currentMembers);
  const [loading, setLoading] = useState(false);
  const [chatInfo, setChatInfo] = useState(null);

  useEffect(() => {
    loadChatInfo();
  }, []);

  const loadChatInfo = async () => {
    try {
      const response = await chatAPI.getChatById(chatId);
      setChatInfo(response.data);
    } catch (error) {
      console.error('Ошибка загрузки информации о чате:', error);
    }
  };

  // Поиск пользователей
  const searchUsers = async (query) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await userAPI.searchUsers(query);
      const users = response.data.users || [];
      
      // Исключаем уже добавленных участников
      const filtered = users.filter(
        u => !members.some(m => m.id === u.id)
      );
      
      setSearchResults(filtered);
    } catch (error) {
      console.error('Ошибка поиска:', error);
    }
  };

  // Добавление участника
  const addMember = async (user) => {
    try {
      setLoading(true);
      await chatAPI.addMember(chatId, user.id);
      
      setMembers(prev => [...prev, user]);
      setSearchResults(prev => prev.filter(u => u.id !== user.id));
      setSearchQuery('');
      
      Alert.alert('Успех', `${user.username} добавлен в группу`);
    } catch (error) {
      console.error('Ошибка добавления участника:', error);
      Alert.alert('Ошибка', 'Не удалось добавить участника');
    } finally {
      setLoading(false);
    }
  };

  // Удаление участника
  const removeMember = async (user) => {
    Alert.alert(
      'Удалить участника',
      `Удалить ${user.username} из группы?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await chatAPI.removeMember(chatId, user.id);
              
              setMembers(prev => prev.filter(m => m.id !== user.id));
              
              Alert.alert('Успех', `${user.username} удален из группы`);
            } catch (error) {
              console.error('Ошибка удаления участника:', error);
              Alert.alert('Ошибка', 'Не удалось удалить участника');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Рендер участника группы
  const renderMember = ({ item }) => {
    const isOwner = chatInfo?.owner_id === item.id;
    const isCurrentUserOwner = chatInfo?.owner_id === currentUser?.id;
    const canRemove = isCurrentUserOwner && item.id !== currentUser?.id;

    return (
      <View style={styles.memberItem}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.username[0]?.toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.username}>{item.username}</Text>
            {isOwner && (
              <View style={styles.ownerBadge}>
                <Text style={styles.ownerBadgeText}>Владелец</Text>
              </View>
            )}
          </View>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        {canRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeMember(item)}
          >
            <Text style={styles.removeText}>Удалить</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Рендер пользователя из поиска
  const renderSearchUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => addMember(item)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.username[0]?.toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <Text style={styles.addText}>Добавить</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Участники ({members.length})
        </Text>
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={renderMember}
          scrollEnabled={false}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Добавить участников</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск пользователей..."
          value={searchQuery}
          onChangeText={searchUsers}
          autoCapitalize="none"
        />
        
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={renderSearchUser}
          ListEmptyComponent={
            searchQuery.length >= 2 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Пользователи не найдены</Text>
              </View>
            ) : null
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5'
  },
  memberItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center'
  },
  userItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center'
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
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
  ownerBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#007AFF',
    borderRadius: 4
  },
  ownerBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600'
  },
  userEmail: {
    fontSize: 13,
    color: '#666'
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FF3B30'
  },
  removeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500'
  },
  addText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500'
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    margin: 15,
    borderRadius: 10,
    fontSize: 16
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
