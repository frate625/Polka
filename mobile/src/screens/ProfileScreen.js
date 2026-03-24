// Экран профиля пользователя
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../store/AuthContext';
import { userAPI, uploadAPI } from '../services/api';
import { useTheme } from '../store/ThemeContext';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { theme, themeMode, setThemeMode } = useTheme();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [status, setStatus] = useState(user?.status || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Выбор аватара
  const pickAvatar = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (file) {
            await uploadAvatar({ uri: URL.createObjectURL(file), file });
          }
        };
        input.click();
        return;
      }

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Ошибка', 'Нужно разрешение на доступ к галерее');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0]);
      }
    } catch (error) {
      console.error('Ошибка выбора аватара:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать изображение');
    }
  };

  // Загрузка аватара
  const uploadAvatar = async (asset) => {
    try {
      setLoading(true);
      console.log('Начало загрузки аватара...');
      
      if (Platform.OS === 'web' && asset.file) {
        console.log('Загрузка для Web...');
        const uploadResponse = await uploadAPI.uploadWebFile(asset.file);
        console.log('Upload response:', uploadResponse.data);
        
        // URL находится в response.data.file.url
        const url = uploadResponse.data.file?.url || uploadResponse.data.url;
        console.log('Полученный URL:', url);
        
        if (!url) {
          throw new Error('URL не получен от сервера');
        }
        
        console.log('Обновление профиля с URL:', url);
        const updateResponse = await userAPI.updateProfile({ avatar_url: url });
        console.log('Update response:', updateResponse.data);
        
        // Обновляем локальное состояние
        setAvatarUrl(url);
        await updateUser({ ...user, avatar_url: url });
        
        Alert.alert('Успешно', 'Аватар обновлен');
      } else {
        const fileData = {
          uri: asset.uri,
          type: 'image/jpeg',
          name: 'avatar.jpg'
        };
        
        const uploadResponse = await uploadAPI.uploadFile(fileData);
        const url = uploadResponse.data.url;
        
        await userAPI.updateProfile({ avatar_url: url });
        setAvatarUrl(url);
        await updateUser({ ...user, avatar_url: url });
        
        Alert.alert('Успешно', 'Аватар обновлен');
      }
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      console.error('Error details:', error.response?.data);
      Alert.alert('Ошибка', `Не удалось загрузить аватар: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Сохранение изменений профиля
  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Ошибка', 'Имя пользователя не может быть пустым');
      return;
    }

    try {
      setLoading(true);
      await userAPI.updateProfile({ username, status });
      await updateUser({ username, status });
      setEditing(false);
      Alert.alert('Успешно', 'Профиль обновлен');
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      Alert.alert('Ошибка', 'Не удалось обновить профиль');
    } finally {
      setLoading(false);
    }
  };

  // Отмена редактирования
  const handleCancel = () => {
    setUsername(user?.username || '');
    setStatus(user?.status || '');
    setEditing(false);
  };

  // Выход из аккаунта
  const handleLogout = async () => {
    // Для Web используем confirm, для мобильных - Alert
    if (Platform.OS === 'web') {
      if (window.confirm('Вы уверены, что хотите выйти из аккаунта?')) {
        try {
          setLoggingOut(true);
          console.log('🚪 Начинается выход из аккаунта...');
          await logout();
          console.log('✅ Выход выполнен успешно');
        } catch (error) {
          console.error('❌ Ошибка при выходе:', error);
          setLoggingOut(false);
        }
      }
    } else {
      Alert.alert(
        'Выход',
        'Вы уверены, что хотите выйти?',
        [
          { text: 'Отмена', style: 'cancel' },
          { 
            text: 'Выйти', 
            onPress: async () => {
              try {
                setLoggingOut(true);
                await logout();
              } catch (error) {
                console.error('Ошибка при выходе:', error);
                setLoggingOut(false);
              }
            }, 
            style: 'destructive' 
          }
        ]
      );
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.secondaryBackground }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={pickAvatar} disabled={loading}>
          {avatarUrl || user?.avatar_url ? (
            <Image
              source={{ uri: avatarUrl || user?.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.username?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.editAvatarBadge}>
            <Text style={styles.editAvatarText}>✏️</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={[styles.section, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.label, { color: theme.colors.secondaryText }]}>Имя пользователя</Text>
        {editing ? (
          <TextInput
            style={[styles.input, { 
              color: theme.colors.text, 
              borderColor: theme.colors.border, 
              backgroundColor: theme.colors.inputBackground 
            }]}
            value={username}
            onChangeText={setUsername}
            placeholder="Имя пользователя"
            placeholderTextColor={theme.colors.secondaryText}
          />
        ) : (
          <Text style={[styles.value, { color: theme.colors.text }]}>{user?.username}</Text>
        )}
      </View>
      <View style={[styles.section, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.label, { color: theme.colors.secondaryText }]}>Email</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{user?.email}</Text>
      </View>
      <View style={[styles.section, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.label, { color: theme.colors.secondaryText }]}>Статус</Text>
        {editing ? (
          <TextInput
            style={[styles.input, { 
              color: theme.colors.text, 
              borderColor: theme.colors.border, 
              backgroundColor: theme.colors.inputBackground 
            }]}
            value={status}
            onChangeText={setStatus}
            placeholder="Ваш статус"
            placeholderTextColor={theme.colors.secondaryText}
            multiline
          />
        ) : (
          <Text style={[styles.value, { color: theme.colors.text }]}>{user?.status || 'Нет статуса'}</Text>
        )}
      </View>
      <View style={[styles.section, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.label, { color: theme.colors.secondaryText }]}>Тема</Text>
        <View style={styles.themeButtons}>
          <TouchableOpacity
            style={[styles.themeButton, themeMode === 'light' && styles.themeButtonActive]}
            onPress={() => setThemeMode('light')}
          >
            <Text style={[styles.themeButtonText, themeMode === 'light' && styles.themeButtonTextActive]}>
              ☀️ Светлая
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.themeButton, themeMode === 'dark' && styles.themeButtonActive]}
            onPress={() => setThemeMode('dark')}
          >
            <Text style={[styles.themeButtonText, themeMode === 'dark' && styles.themeButtonTextActive]}>
              🌙 Темная
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.themeButton, themeMode === 'auto' && styles.themeButtonActive]}
            onPress={() => setThemeMode('auto')}
          >
            <Text style={[styles.themeButtonText, themeMode === 'auto' && styles.themeButtonTextActive]}>
              🔄 Авто
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {editing ? (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Отмена</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={() => setEditing(true)}
        >
          <Text style={styles.editButtonText}>Редактировать профиль</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.error }, (loggingOut || loading) && styles.buttonDisabled]}
        onPress={handleLogout}
        disabled={loggingOut || loading}
      >
        <Text style={styles.logoutButtonText}>
          {loggingOut ? 'Выход...' : 'Выйти'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '600'
  },
  editAvatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5B93FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3
  },
  editAvatarText: {
    fontSize: 16
  },
  section: {
    padding: 15,
    marginTop: 10,
    borderBottomWidth: 1
  },
  label: {
    fontSize: 12,
    marginBottom: 5
  },
  value: {
    fontSize: 16
  },
  input: {
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10
  },
  themeButtons: {
    flexDirection: 'row',
    marginTop: 8
  },
  themeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: 'transparent'
  },
  themeButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#5B93FF'
  },
  themeButtonText: {
    fontSize: 13,
    color: '#666'
  },
  themeButtonTextActive: {
    color: '#fff',
    fontWeight: '600'
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 15
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    flex: 1
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600'
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  buttonDisabled: {
    backgroundColor: '#ccc'
  }
});
