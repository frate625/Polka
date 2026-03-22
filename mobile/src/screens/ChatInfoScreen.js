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
  Platform
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { messageAPI } from '../services/api';
import { useTheme } from '../store/ThemeContext';

export default function ChatInfoScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId, chatName } = route.params;
  const { theme } = useTheme();
  
  const [activeTab, setActiveTab] = useState('media'); // media, files, voice, links
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllMessages();
  }, [chatId]);

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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
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
  }
});
