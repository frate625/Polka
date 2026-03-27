// Экран информации о чате с медиа, файлами, голосовыми и ссылками
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
  Linking,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { messageAPI, chatAPI, uploadAPI } from '../services/api';
import { useTheme } from '../store/ThemeContext';
import { useAuth } from '../store/AuthContext';
import * as ImagePicker from 'expo-image-picker';

export default function ChatInfoScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId, chatName } = route.params;
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('media'); // media, files, voice, links
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatInfo, setChatInfo] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAllMessages();
    loadChatInfo();
  }, [chatId]);

  const loadChatInfo = async () => {
    try {
      const response = await chatAPI.getChatById(chatId);
      setChatInfo(response.data);
    } catch (error) {
      console.error('Ошибка загрузки информации о чате:', error);
    }
  };

  useEffect(() => {
    filterMessages();
  }, [messages, activeTab, searchQuery]);

  const loadAllMessages = async () => {
    try {
      setLoading(true);
      const response = await messageAPI.getMessages(chatId, { limit: 1000, offset: 0 });
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMessages = () => {
    let filtered = [...messages];

    // Фильтр по типу
    switch (activeTab) {
      case 'media':
        filtered = filtered.filter(m => m.type === 'image' || m.type === 'video');
        break;
      case 'files':
        filtered = filtered.filter(m => m.type === 'file');
        break;
      case 'voice':
        filtered = filtered.filter(m => m.type === 'voice');
        break;
      case 'video_notes':
        filtered = filtered.filter(m => m.type === 'video_note');
        break;
      case 'links':
        filtered = filtered.filter(m => {
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          return m.type === 'text' && urlRegex.test(m.content);
        });
        break;
      case 'search':
        if (searchQuery.trim()) {
          filtered = filtered.filter(m => 
            m.content?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        break;
    }

    setFilteredMessages(filtered);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const openFile = (url) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const extractLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  // Удаление чата у себя
  const handleHideChat = async () => {
    if (Platform.OS === 'web') {
      if (!window.confirm('Удалить чат у себя? Чат останется у собеседника.')) return;
    } else {
      Alert.alert(
        'Удалить чат у себя?',
        'Чат останется у собеседника',
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Удалить', style: 'destructive', onPress: () => performHideChat() }
        ]
      );
      return;
    }
    await performHideChat();
  };

  const performHideChat = async () => {
    try {
      await chatAPI.deleteChat(chatId, false);
      navigation.navigate('ChatsList');
    } catch (error) {
      console.error('Ошибка удаления чата:', error);
      Alert.alert('Ошибка', 'Не удалось удалить чат');
    }
  };

  // Удаление чата для всех
  const handleDeleteForEveryone = async () => {
    if (Platform.OS === 'web') {
      if (!window.confirm('Удалить чат для обоих? Это действие нельзя отменить!')) return;
    } else {
      Alert.alert(
        'Удалить чат для всех?',
        'Чат удалится у обоих пользователей. Это действие нельзя отменить!',
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Удалить', style: 'destructive', onPress: () => performDeleteForEveryone() }
        ]
      );
      return;
    }
    await performDeleteForEveryone();
  };

  const performDeleteForEveryone = async () => {
    try {
      await chatAPI.deleteChat(chatId, true);
      navigation.navigate('ChatsList');
    } catch (error) {
      console.error('Ошибка удаления чата:', error);
      Alert.alert('Ошибка', error.response?.data?.error || 'Не удалось удалить чат');
    }
  };

  // Выход из группы
  const handleLeaveGroup = async () => {
    if (Platform.OS === 'web') {
      if (!window.confirm('Покинуть группу?')) return;
    } else {
      Alert.alert(
        'Покинуть группу?',
        'Вы выйдете из этой группы',
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Выйти', style: 'destructive', onPress: () => performLeaveGroup() }
        ]
      );
      return;
    }
    await performLeaveGroup();
  };

  const performLeaveGroup = async () => {
    try {
      await chatAPI.leaveGroup(chatId);
      navigation.navigate('ChatsList');
    } catch (error) {
      console.error('Ошибка выхода из группы:', error);
      Alert.alert('Ошибка', 'Не удалось выйти из группы');
    }
  };

  // Загрузка аватара группы
  const handleUploadAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Необходимо разрешение на доступ к фото');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        
        let uploadResponse;
        if (Platform.OS === 'web') {
          const response = await fetch(result.assets[0].uri);
          const blob = await response.blob();
          const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
          uploadResponse = await uploadAPI.uploadWebFile(file);
        } else {
          uploadResponse = await uploadAPI.uploadFile({
            uri: result.assets[0].uri,
            type: 'image/jpeg',
            fileName: 'avatar.jpg'
          });
        }

        const avatarUrl = uploadResponse.data.fileUrl;
        await chatAPI.updateChat(chatId, { avatar_url: avatarUrl });
        
        setChatInfo(prev => ({ ...prev, avatar_url: avatarUrl }));
        Alert.alert('Успех', 'Аватар группы обновлен');
      }
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить аватар');
    } finally {
      setUploading(false);
    }
  };

  // Рендер медиа (фото/видео)
  const renderMediaItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.mediaItem}
      onPress={() => openFile(item.file_url)}
    >
      {item.type === 'image' ? (
        <Image source={{ uri: item.file_url }} style={styles.mediaThumbnail} />
      ) : (
        <View style={[styles.mediaThumbnail, { backgroundColor: theme.colors.secondaryBackground }]}>
          <Text style={styles.videoIcon}>🎬</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Рендер файла
  const renderFileItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.fileItem, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}
      onPress={() => openFile(item.file_url)}
    >
      <Text style={styles.fileIcon}>📄</Text>
      <View style={styles.fileInfo}>
        <Text style={[styles.fileName, { color: theme.colors.text }]} numberOfLines={1}>
          {item.file_name || 'Файл'}
        </Text>
        <Text style={[styles.fileDate, { color: theme.colors.secondaryText }]}>
          {formatDate(item.created_at)} • {formatFileSize(item.file_size)}
        </Text>
      </View>
      <Text style={[styles.downloadIcon, { color: theme.colors.primary }]}>⬇️</Text>
    </TouchableOpacity>
  );

  // Рендер голосового
  const renderVoiceItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.voiceItem, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}
      onPress={() => openFile(item.file_url)}
    >
      <Text style={styles.voiceIcon}>🎤</Text>
      <View style={styles.voiceInfo}>
        <Text style={[styles.voiceSender, { color: theme.colors.text }]}>
          {item.sender?.username || 'Пользователь'}
        </Text>
        <Text style={[styles.voiceDate, { color: theme.colors.secondaryText }]}>
          {formatDate(item.created_at)}
        </Text>
      </View>
      <Text style={[styles.playIcon, { color: theme.colors.primary }]}>▶️</Text>
    </TouchableOpacity>
  );

  // Рендер видео-кружочка
  const renderVideoNoteItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.videoNoteItem}
      onPress={() => openFile(item.file_url)}
    >
      {Platform.OS === 'web' ? (
        <video
          src={item.file_url}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
            backgroundColor: '#000'
          }}
        />
      ) : (
        <View style={[styles.videoNotePlaceholder, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.videoNoteIcon}>⭕</Text>
        </View>
      )}
      <View style={styles.videoNotePlayOverlay}>
        <Text style={styles.videoNotePlay}>▶️</Text>
      </View>
    </TouchableOpacity>
  );

  // Рендер ссылки
  const renderLinkItem = ({ item }) => {
    const links = extractLinks(item.content);
    
    return links.map((link, index) => (
      <TouchableOpacity 
        key={`${item.id}-${index}`}
        style={[styles.linkItem, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}
        onPress={() => openFile(link)}
      >
        <Text style={styles.linkIcon}>🔗</Text>
        <View style={styles.linkInfo}>
          <Text style={[styles.linkUrl, { color: theme.colors.primary }]} numberOfLines={1}>
            {link}
          </Text>
          <Text style={[styles.linkDate, { color: theme.colors.secondaryText }]}>
            {formatDate(item.created_at)} • {item.sender?.username}
          </Text>
        </View>
      </TouchableOpacity>
    ));
  };

  // Рендер результата поиска
  const renderSearchItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.searchItem, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}
      onPress={() => {
        navigation.navigate('Chat', { chatId, chatName, scrollToMessageId: item.id });
      }}
    >
      <View style={styles.searchHeader}>
        <Text style={[styles.searchSender, { color: theme.colors.text }]}>
          {item.sender?.username || 'Пользователь'}
        </Text>
        <Text style={[styles.searchDate, { color: theme.colors.secondaryText }]}>
          {formatDate(item.created_at)}
        </Text>
      </View>
      <Text style={[styles.searchContent, { color: theme.colors.text }]} numberOfLines={2}>
        {item.content}
      </Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (activeTab === 'search') {
      return (
        <View style={{ flex: 1 }}>
          <View style={[styles.searchContainer, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
            <TextInput
              style={[styles.searchInput, { 
                backgroundColor: theme.colors.inputBackground, 
                color: theme.colors.text 
              }]}
              placeholder="Поиск сообщений..."
              placeholderTextColor={theme.colors.secondaryText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
          <FlatList
            data={filteredMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderSearchItem}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.colors.secondaryText }]}>
                  {searchQuery ? 'Ничего не найдено' : 'Введите запрос для поиска'}
                </Text>
              </View>
            }
          />
        </View>
      );
    }

    let renderItem;
    let numColumns = 1;
    
    switch (activeTab) {
      case 'media':
        renderItem = renderMediaItem;
        numColumns = 3;
        break;
      case 'files':
        renderItem = renderFileItem;
        break;
      case 'voice':
        renderItem = renderVoiceItem;
        break;
      case 'video_notes':
        renderItem = renderVideoNoteItem;
        numColumns = 3;
        break;
      case 'links':
        renderItem = renderLinkItem;
        break;
    }

    return (
      <FlatList
        data={filteredMessages}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderItem}
        numColumns={numColumns}
        key={numColumns}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.secondaryText }]}>
              {loading ? 'Загрузка...' : 'Нет данных'}
            </Text>
          </View>
        }
      />
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Верхняя секция с аватаром и именем */}
      <View style={[styles.headerSection, { backgroundColor: theme.colors.card }]}>
        <View style={styles.avatarContainer}>
          {chatInfo?.avatar_url ? (
            <Image source={{ uri: chatInfo.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.avatarText}>{chatName?.[0]?.toUpperCase() || 'C'}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.chatName, { color: theme.colors.text }]}>{chatName}</Text>
        {chatInfo?.type === 'group' && chatInfo.owner_id === user?.id && (
          <TouchableOpacity 
            style={[styles.changePhotoButton, { borderColor: theme.colors.border }]}
            onPress={handleUploadAvatar}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color={theme.colors.primary} size="small" />
            ) : (
              <Text style={[styles.changePhotoText, { color: theme.colors.primary }]}>Изменить фото</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Секции с категориями */}
      <View style={[styles.section, { backgroundColor: theme.colors.card, marginTop: 12 }]}>
        <TouchableOpacity style={[styles.sectionItem, { borderBottomColor: theme.colors.border }]} onPress={() => setActiveTab('media')}>
          <Image source={require('../../assets/icons/image.png')} style={styles.sectionIconImage} resizeMode="contain" />
          <Text style={[styles.sectionText, { color: theme.colors.text }]}>Фотографии</Text>
          <Text style={[styles.sectionArrow, { color: theme.colors.secondaryText }]}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.sectionItem, { borderBottomColor: theme.colors.border }]} onPress={() => setActiveTab('video_notes')}>
          <Image source={require('../../assets/icons/video-message.png')} style={styles.sectionIconImage} resizeMode="contain" />
          <Text style={[styles.sectionText, { color: theme.colors.text }]}>Видео</Text>
          <Text style={[styles.sectionArrow, { color: theme.colors.secondaryText }]}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.sectionItem, { borderBottomWidth: 0 }]} onPress={() => setActiveTab('voice')}>
          <Image source={require('../../assets/icons/microphone.png')} style={styles.sectionIconImage} resizeMode="contain" />
          <Text style={[styles.sectionText, { color: theme.colors.text }]}>Аудиозаписи</Text>
          <Text style={[styles.sectionArrow, { color: theme.colors.secondaryText }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.card, marginTop: 12 }]}>
        <TouchableOpacity style={[styles.sectionItem, { borderBottomColor: theme.colors.border }]} onPress={() => setActiveTab('files')}>
          <Image source={require('../../assets/icons/file.png')} style={styles.sectionIconImage} resizeMode="contain" />
          <Text style={[styles.sectionText, { color: theme.colors.text }]}>Файлы</Text>
          <Text style={[styles.sectionArrow, { color: theme.colors.secondaryText }]}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.sectionItem, { borderBottomWidth: 0 }]} onPress={() => setActiveTab('links')}>
          <Image source={require('../../assets/icons/link.png')} style={styles.sectionIconImage} resizeMode="contain" />
          <Text style={[styles.sectionText, { color: theme.colors.text }]}>Ссылки</Text>
          <Text style={[styles.sectionArrow, { color: theme.colors.secondaryText }]}>›</Text>
        </TouchableOpacity>
      </View>

      {activeTab !== 'media' && (
        <View style={{ marginTop: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && { borderBottomColor: theme.colors.primary }]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'search' ? theme.colors.primary : theme.colors.secondaryText }]}>
            🔍 Поиск
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'media' && { borderBottomColor: theme.colors.primary }]}
          onPress={() => setActiveTab('media')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'media' ? theme.colors.primary : theme.colors.secondaryText }]}>
            🖼️ Медиа
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'files' && { borderBottomColor: theme.colors.primary }]}
          onPress={() => setActiveTab('files')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'files' ? theme.colors.primary : theme.colors.secondaryText }]}>
            📄 Файлы
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'voice' && { borderBottomColor: theme.colors.primary }]}
          onPress={() => setActiveTab('voice')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'voice' ? theme.colors.primary : theme.colors.secondaryText }]}>
            🎤 Голосовые
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'video_notes' && { borderBottomColor: theme.colors.primary }]}
          onPress={() => setActiveTab('video_notes')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'video_notes' ? theme.colors.primary : theme.colors.secondaryText }]}>
            ⭕ Кружочки
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'links' && { borderBottomColor: theme.colors.primary }]}
          onPress={() => setActiveTab('links')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'links' ? theme.colors.primary : theme.colors.secondaryText }]}>
            🔗 Ссылки
          </Text>
        </TouchableOpacity>
      </ScrollView>

          {renderContent()}
        </View>
      )}

      {/* Кнопки управления чатом */}
      <View style={[styles.actionsContainer, { backgroundColor: theme.colors.card, marginTop: 12 }]}>
        {chatInfo?.type === 'group' ? (
          <TouchableOpacity 
            style={[styles.actionItem, { borderBottomWidth: 0 }]}
            onPress={handleLeaveGroup}
          >
            <Text style={[styles.actionText, { color: '#FF3B30' }]}>Покинуть группу</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity 
              style={[styles.actionItem, { borderBottomColor: theme.colors.border }]}
              onPress={handleHideChat}
            >
              <Text style={[styles.actionText, { color: '#FF9500' }]}>Удалить у себя</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionItem, { borderBottomWidth: 0 }]}
              onPress={handleDeleteForEveryone}
            >
              <Text style={[styles.actionText, { color: '#FF3B30' }]}>Удалить для всех</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  headerSection: {
    padding: 20,
    alignItems: 'center'
  },
  avatarContainer: {
    marginBottom: 16
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50
  },
  avatarPlaceholder: {
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
  chatName: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8
  },
  changePhotoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600'
  },
  section: {
    borderRadius: 12,
    marginHorizontal: 8,
    overflow: 'hidden'
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 28
  },
  sectionIconImage: {
    width: 24,
    height: 24,
    marginRight: 16
  },
  sectionText: {
    flex: 1,
    fontSize: 16
  },
  sectionArrow: {
    fontSize: 24,
    fontWeight: '300'
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500'
  },
  searchContainer: {
    padding: 12,
    borderBottomWidth: 1
  },
  searchInput: {
    padding: 10,
    borderRadius: 8,
    fontSize: 16
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14
  },
  // Media
  mediaItem: {
    flex: 1/3,
    aspectRatio: 1,
    padding: 2
  },
  mediaThumbnail: {
    flex: 1,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center'
  },
  videoIcon: {
    fontSize: 40
  },
  // Files
  fileItem: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1
  },
  fileIcon: {
    fontSize: 32,
    marginRight: 12
  },
  fileInfo: {
    flex: 1
  },
  fileName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4
  },
  fileDate: {
    fontSize: 12
  },
  downloadIcon: {
    fontSize: 20
  },
  // Voice
  voiceItem: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1
  },
  voiceIcon: {
    fontSize: 28,
    marginRight: 12
  },
  voiceInfo: {
    flex: 1
  },
  voiceSender: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4
  },
  voiceDate: {
    fontSize: 12
  },
  playIcon: {
    fontSize: 24
  },
  // Video Notes (кружочки)
  videoNoteItem: {
    flex: 1/3,
    aspectRatio: 1,
    padding: 4,
    position: 'relative'
  },
  videoNotePlaceholder: {
    flex: 1,
    borderRadius: 150,
    justifyContent: 'center',
    alignItems: 'center'
  },
  videoNoteIcon: {
    fontSize: 40
  },
  videoNotePlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 150,
    margin: 4
  },
  videoNotePlay: {
    fontSize: 40
  },
  // Links
  linkItem: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1
  },
  linkIcon: {
    fontSize: 24,
    marginRight: 12
  },
  linkInfo: {
    flex: 1
  },
  linkUrl: {
    fontSize: 14,
    marginBottom: 4
  },
  linkDate: {
    fontSize: 12
  },
  // Search
  searchItem: {
    padding: 12,
    borderBottomWidth: 1
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  searchSender: {
    fontSize: 14,
    fontWeight: '600'
  },
  searchDate: {
    fontSize: 12
  },
  searchContent: {
    fontSize: 14,
    lineHeight: 20
  },
  // Actions
  actionsContainer: {
    borderRadius: 12,
    marginHorizontal: 8,
    marginBottom: 20,
    overflow: 'hidden'
  },
  actionItem: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600'
  }
});
