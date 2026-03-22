// Экран для создания групповогочата
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { userAPI, chatAPI } from '../services/api';

export default function CreateGroupScreen() {
  const navigation = useNavigation();
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Поиск пользователей
  const searchUsers = async (query) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await userAPI.searchUsers(query);
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error('Ошибка поиска пользователей:', error);
    }
  };

  // Переключение выбора пользователя
  const toggleUserSelection = (user) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.id === user.id);
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  // Создание группы
  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Ошибка', 'Введите название группы');
      return;
    }

    if (selectedUsers.length === 0) {
      Alert.alert('Ошибка', 'Выберите хотя бы одного участника');
      return;
    }

    try {
      setLoading(true);
      const response = await chatAPI.createChat({
        name: groupName,
        user_ids: selectedUsers.map((u) => u.id),
        type: 'group'
      });

      if (response.data.chat) {
        navigation.navigate('Chat', {
          chatId: response.data.chat.id,
          chatName: groupName,
          chatType: 'group'
        });
      }
    } catch (error) {
      console.error('Ошибка создания группы:', error);
      Alert.alert('Ошибка', 'Не удалось создать группу');
    } finally {
      setLoading(false);
    }
  };

  // Рендер выбранного пользователя
  const renderSelectedUser = ({ item }) => (
    <TouchableOpacity
      style={styles.selectedUser}
      onPress={() => toggleUserSelection(item)}
    >
      <Text style={styles.selectedUserText}>{item.username}</Text>
      <Text style={styles.removeText}>✕</Text>
    </TouchableOpacity>
  );

  // Рендер пользователя из результатов поиска
  const renderUser = ({ item }) => {
    const isSelected = selectedUsers.some((u) => u.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.userItemSelected]}
        onPress={() => toggleUserSelection(item)}
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
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.groupNameInput}
          placeholder="Название группы"
          value={groupName}
          onChangeText={setGroupName}
          maxLength={100}
        />

        {selectedUsers.length > 0 && (
          <View style={styles.selectedContainer}>
            <Text style={styles.selectedTitle}>
              Выбрано: {selectedUsers.length}
            </Text>
            <FlatList
              horizontal
              data={selectedUsers}
              keyExtractor={(item) => item.id}
              renderItem={renderSelectedUser}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        <TextInput
          style={styles.searchInput}
          placeholder="Поиск участников..."
          value={searchQuery}
          onChangeText={searchUsers}
          autoCapitalize="none"
        />
      </View>

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        ListEmptyComponent={
          searchQuery.length >= 2 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Пользователи не найдены</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Введите имя для поиска участников
              </Text>
            </View>
          )
        }
      />

      {selectedUsers.length > 0 && (
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={createGroup}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Создание...' : 'Создать группу'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 10
  },
  groupNameInput: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    margin: 15,
    marginBottom: 10,
    borderRadius: 10,
    fontSize: 16,
    fontWeight: '600'
  },
  selectedContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10
  },
  selectedTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8
  },
  selectedUser: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8
  },
  selectedUserText: {
    color: '#fff',
    fontSize: 14,
    marginRight: 6
  },
  removeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    marginHorizontal: 15,
    borderRadius: 10,
    fontSize: 16
  },
  userItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center'
  },
  userItemSelected: {
    backgroundColor: '#f0f7ff'
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
  userEmail: {
    fontSize: 13,
    color: '#666'
  },
  checkmark: {
    fontSize: 20,
    color: '#007AFF',
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
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  createButtonDisabled: {
    backgroundColor: '#ccc'
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});
