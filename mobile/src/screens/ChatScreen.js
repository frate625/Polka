// Экран чата с сообщениями и отправкой
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Image
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { messageAPI, chatAPI } from '../services/api';
import { useSocket } from '../store/SocketContext';
import { useAuth } from '../store/AuthContext';
import { useTheme } from '../store/ThemeContext';
import MessageItem from '../components/MessageItem';
import MessageDateSeparator from '../components/MessageDateSeparator';
import MediaPicker from '../components/MediaPicker';
import RecordButton from '../components/RecordButton';
import CallScreen from '../components/CallScreen';
import useWebRTC from '../hooks/useWebRTC';

export default function ChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId, chatName, chatType, chatMembers } = route.params;
  const { socket } = useSocket();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardChats, setForwardChats] = useState([]);
  const flatListRef = useRef(null);
  const typingTimeout = useRef(null);

  // WebRTC для звонков
  const {
    localStream,
    remoteStream,
    isCallActive,
    incomingCall,
    makeCall,
    answerCall,
    endCall,
    declineCall
  } = useWebRTC(socket.socket, user.id);

  // Получаем ID собеседника (для персональных чатов)
  const isPersonalChat = chatType === 'personal' || chatType === 'private';
  const recipientId = isPersonalChat && chatMembers 
    ? chatMembers.find(m => (m.id || m.user_id) !== user.id)?.id || chatMembers.find(m => (m.id || m.user_id) !== user.id)?.user_id
    : null;

  // Подготовка сообщений с разделителями
  const prepareMessagesWithSeparators = () => {
    const items = [];
    let lastDate = null;
    let lastTime = null;

    messages.forEach((message, index) => {
      const messageDate = new Date(message.created_at);
      const messageDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

      // Проверяем, нужен ли разделитель даты
      if (!lastDate || messageDateOnly.getTime() !== lastDate.getTime()) {
        items.push({
          type: 'date_separator',
          id: `date_${message.id}`,
          date: message.created_at
        });
        lastDate = messageDateOnly;
      }

      // Проверяем, нужен ли временной отступ (более 10 минут)
      if (lastTime) {
        const timeDiff = (messageDate.getTime() - lastTime.getTime()) / (1000 * 60); // в минутах
        if (timeDiff > 10) {
          items.push({
            type: 'time_gap',
            id: `gap_${message.id}`
          });
        }
      }

      // Добавляем само сообщение
      items.push({
        type: 'message',
        ...message
      });

      lastTime = messageDate;
    });

    return items;
  };

  const messagesWithSeparators = prepareMessagesWithSeparators();

  // Настройка header с кнопками
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          onPress={() => {
            if (isPersonalChat && recipientId) {
              navigation.navigate('UserProfile', {
                userId: recipientId,
                userName: chatName
              });
            }
          }}
          disabled={!isPersonalChat}
        >
          <Text style={{ fontSize: 17, fontWeight: '600', color: '#000' }}>
            {chatName}
          </Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', marginRight: 10 }}>
          {/* Кнопки звонков (только для персональных чатов) */}
          {isPersonalChat && recipientId && (
            <>
              <TouchableOpacity
                style={{ padding: 5, marginHorizontal: 5 }}
                onPress={() => makeCall(chatId, recipientId, false)}
              >
                <Image 
                  source={require('../../assets/icons/phone-call.png')} 
                  style={{ width: 22, height: 22 }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ padding: 5, marginHorizontal: 5 }}
                onPress={() => makeCall(chatId, recipientId, true)}
              >
                <Image 
                  source={require('../../assets/icons/video-call-alt.png')} 
                  style={{ width: 22, height: 22 }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            style={{ padding: 5, marginHorizontal: 5 }}
            onPress={() => navigation.navigate('ChatInfo', {
              chatId,
              chatName
            })}
          >
            <Image 
              source={require('../../assets/icons/info.png')} 
              style={{ width: 22, height: 22 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
          {chatType === 'group' && (
            <TouchableOpacity
              style={{ padding: 5, marginHorizontal: 5 }}
              onPress={() => navigation.navigate('GroupManage', {
                chatId,
                currentMembers: chatMembers || []
              })}
            >
              <Image 
                source={require('../../assets/icons/settings.png')} 
                style={{ width: 22, height: 22 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </View>
      )
    });
  }, [chatType, chatId, chatMembers, chatName, recipientId]);

  // Загрузка сообщений при открытии чата
  useEffect(() => {
    console.log('📱 ChatScreen mounted for chatId:', chatId);
    isMountedRef.current = true;
    loadMessages();
    
    console.log('🔌 Joining chat:', chatId);
    socket.joinChat(chatId);
    
    // Сбрасываем счетчик непрочитанных сообщений при заходе в чат
    if (socket.socket) {
      socket.socket.emit('message_read', { chatId });
    }
    
    return () => {
      console.log('🔌 Leaving chat on cleanup');
      socket.leaveChat(chatId);
      isMountedRef.current = false;
    };
  }, [chatId]);
  
  // Регистрируем обработчики напрямую в socket.io ОДИН раз
  useEffect(() => {
    if (!socket.socket || listenersRegisteredRef.current) {
      console.log('⚠️ Skip listener registration:', { socketReady: !!socket.socket, alreadyRegistered: listenersRegisteredRef.current });
      return;
    }
    
    console.log('👂 Registering PERMANENT socket.io listeners');
    listenersRegisteredRef.current = true;
    
    const handleError = (error) => {
      if (!isMountedRef.current) return;
      console.error('❌ Socket error:', error);
      Alert.alert('Ошибка', error.message || 'Произошла ошибка');
    };
    
    // Регистрируем напрямую в socket.io и НИКОГДА НЕ УДАЛЯЕМ
    socket.socket.on('new_message', handleNewMessage);
    socket.socket.on('message_edited', handleMessageEdited);
    socket.socket.on('message_deleted', handleMessageDeleted);
    socket.socket.on('reaction_added', handleReactionAdded);
    socket.socket.on('user_typing', handleUserTyping);
    socket.socket.on('user_stopped_typing', handleUserStoppedTyping);
    socket.socket.on('error', handleError);
    
    console.log('✅ PERMANENT listeners registered - will NEVER be removed');
  }, [socket.socket]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await messageAPI.getMessages(chatId, { limit: 50, offset: 0 });
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить сообщения');
    } finally {
      setLoading(false);
    }
  };

  // Используем useRef для хранения текущего chatId, чтобы избежать пересоздания колбэков
  const chatIdRef = useRef(chatId);
  const userIdRef = useRef(user.id);
  const isMountedRef = useRef(true);
  const listenersRegisteredRef = useRef(false);
  
  useEffect(() => {
    chatIdRef.current = chatId;
    userIdRef.current = user.id;
  }, [chatId, user.id]);

  const handleNewMessage = useCallback((message) => {
    console.log('🔔 Получено событие new_message:', {
      messageChatId: message.chat_id,
      messageChatIdType: typeof message.chat_id,
      currentChatId: chatIdRef.current,
      currentChatIdType: typeof chatIdRef.current,
      matches: String(message.chat_id) === String(chatIdRef.current),
      messageId: message.id,
      senderId: message.sender_id,
      content: message.content?.substring(0, 30)
    });
    
    // Приводим к строке для сравнения
    if (String(message.chat_id) === String(chatIdRef.current)) {
      console.log('✅ Сообщение добавляется в список');
      setMessages((prev) => [...prev, message]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      
      // Звук только если сообщение не от меня
      if (message.sender_id !== userIdRef.current && Platform.OS === 'web') {
        try {
          // Пытаемся использовать кастомный звук
          const audio = new Audio('/assets/sounds/notification.mp3');
          audio.volume = 0.5;
          audio.play().catch(() => {
            // Fallback - встроенный звук если файла нет
            try {
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              
              oscillator.frequency.value = 800;
              oscillator.type = 'sine';
              
              gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
              
              oscillator.start(audioContext.currentTime);
              oscillator.stop(audioContext.currentTime + 0.1);
            } catch (e) {}
          });
        } catch (e) {
          console.log('Sound play error:', e);
        }
      }
    }
  }, []);

  const handleMessageEdited = useCallback((data) => {
    if (String(data.chatId) === String(chatIdRef.current)) {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId ? { ...msg, content: data.content, edited: true } : msg
      ));
    }
  }, []);

  const handleMessageDeleted = useCallback((data) => {
    if (String(data.chatId) === String(chatIdRef.current)) {
      setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
    }
  }, []);

  const handleReactionAdded = useCallback((data) => {
    if (String(data.chatId) === String(chatIdRef.current)) {
      setMessages(prev => prev.map(msg => {
        if (msg.id === data.messageId) {
          const reactions = msg.reactions || [];
          const existingReactionIndex = reactions.findIndex(r => r.emoji === data.emoji);
          
          if (existingReactionIndex >= 0) {
            const updated = [...reactions];
            const userReactions = updated[existingReactionIndex].users || [];
            if (!userReactions.includes(data.userId)) {
              updated[existingReactionIndex] = {
                ...updated[existingReactionIndex],
                count: updated[existingReactionIndex].count + 1,
                users: [...userReactions, data.userId]
              };
            }
            return { ...msg, reactions: updated };
          } else {
            return {
              ...msg,
              reactions: [...reactions, {
                emoji: data.emoji,
                count: 1,
                users: [data.userId]
              }]
            };
          }
        }
        return msg;
      }));
    }
  }, []);

  const handleUserTyping = useCallback((data) => {
    if (String(data.chatId) === String(chatIdRef.current) && data.userId !== userIdRef.current) {
      setTypingUsers((prev) => {
        if (!prev.includes(data.username)) {
          return [...prev, data.username];
        }
        return prev;
      });
    }
  }, []);

  const handleUserStoppedTyping = useCallback((data) => {
    if (String(data.chatId) === String(chatIdRef.current)) {
      setTypingUsers((prev) => prev.filter((name) => name !== data.username));
    }
  }, []);

  const sendMessage = () => {
    const text = inputText.trim();
    if (!text) return;

    if (editingMessage) {
      // Редактирование сообщения
      socket.editMessage(editingMessage.id, chatId, text);
      setEditingMessage(null);
    } else if (replyToMessage) {
      // Ответ на сообщение
      socket.sendMessage(chatId, text, 'text', {
        reply_to: replyToMessage.id
      });
      setReplyToMessage(null);
    } else {
      // Обычное сообщение
      socket.sendMessage(chatId, text, 'text');
    }
    
    setInputText('');
    socket.stopTyping(chatId);
    setIsTyping(false);
  };

  const handleTextChange = (text) => {
    setInputText(text);

    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      socket.startTyping(chatId);
    }

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(() => {
      if (isTyping) {
        socket.stopTyping(chatId);
        setIsTyping(false);
      }
    }, 2000);
  };

  const handleMediaSelected = (fileData) => {
    socket.sendMessage(chatId, '', fileData.type, {
      file_url: fileData.url,
      file_name: fileData.name,
      file_size: fileData.size
    });
  };

  const handleVideoNoteSelected = (videoNoteData) => {
    socket.sendMessage(chatId, '', 'video_note', {
      file_url: videoNoteData.url,
      file_name: videoNoteData.name,
      file_size: videoNoteData.size
    });
  };

  const handleVoiceSelected = (voiceData) => {
    socket.sendMessage(chatId, '', 'voice', {
      file_url: voiceData.url,
      file_name: voiceData.name,
      file_size: voiceData.size
    });
  };

  // Long press на сообщении - открыть меню
  const handleMessageLongPress = (message) => {
    setSelectedMessage(message);
    setShowMessageMenu(true);
  };

  // Ответить на сообщение
  const handleReply = () => {
    setReplyToMessage(selectedMessage);
    setShowMessageMenu(false);
    setSelectedMessage(null);
  };

  // Переслать сообщение
  const handleForward = async () => {
    setShowMessageMenu(false);
    try {
      const response = await chatAPI.getChats();
      const chats = response.data.chats || [];
      setForwardChats(chats.filter(c => c.id !== chatId));
      setShowForwardModal(true);
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить список чатов');
    }
  };

  // Переслать в выбранный чат
  const forwardToChat = (targetChatId) => {
    if (!selectedMessage) return;
    
    // Создаем контент с пометкой о пересылке
    const forwardedText = selectedMessage.type === 'text'
      ? `➡️ Переслано из ${chatName}\n\n${selectedMessage.content}`
      : selectedMessage.content;
    
    const messageData = {
      content: forwardedText,
      type: selectedMessage.type,
      file_url: selectedMessage.file_url
    };
    
    socket.sendMessage(targetChatId, messageData.content, messageData.type, {
      file_url: messageData.file_url
    });
    
    setShowForwardModal(false);
    setSelectedMessage(null);
    Alert.alert('Успешно', 'Сообщение переслано');
  };

  // Редактировать сообщение
  const handleEdit = () => {
    if (selectedMessage.sender_id !== user.id) {
      Alert.alert('Ошибка', 'Можно редактировать только свои сообщения');
      return;
    }
    
    const messageAge = Date.now() - new Date(selectedMessage.created_at).getTime();
    const maxAge = 48 * 60 * 60 * 1000; // 48 hours
    
    if (messageAge > maxAge) {
      Alert.alert('Ошибка', 'Можно редактировать только сообщения младше 48 часов');
      return;
    }

    setEditingMessage(selectedMessage);
    setInputText(selectedMessage.content);
    setShowMessageMenu(false);
    setSelectedMessage(null);
  };

  // Удалить сообщение
  const handleDelete = () => {
    console.log('🗑️ handleDelete вызван', selectedMessage);
    setShowMessageMenu(false);
    setShowDeleteModal(true);
  };

  const deleteMessage = (forEveryone) => {
    console.log('Удаление сообщения:', {
      messageId: selectedMessage.id,
      chatId,
      forEveryone
    });
    socket.deleteMessage(selectedMessage.id, chatId, forEveryone);
    setSelectedMessage(null);
    setShowMessageMenu(false);
  };

  // Добавить реакцию
  const handleAddReaction = (emoji) => {
    socket.addReaction(selectedMessage.id, chatId, emoji);
    setShowMessageMenu(false);
    setSelectedMessage(null);
  };

  // Отмена Reply/Edit
  const cancelReplyOrEdit = () => {
    setReplyToMessage(null);
    setEditingMessage(null);
    setInputText('');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.secondaryBackground }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messagesWithSeparators}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (item.type === 'date_separator') {
            return <MessageDateSeparator date={item.date} />;
          } else if (item.type === 'time_gap') {
            return <View style={{ height: 20 }} />;
          } else {
            return (
              <MessageItem
                message={item}
                isOwnMessage={item.sender_id === user.id}
                onLongPress={() => handleMessageLongPress(item)}
                theme={theme}
              />
            );
          }
        }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListFooterComponent={
          typingUsers.length > 0 ? (
            <View style={styles.typingContainer}>
              <Text style={[styles.typingText, { color: theme.colors.secondaryText }]}>
                {typingUsers.join(', ')} печатает...
              </Text>
            </View>
          ) : null
        }
      />
      {(replyToMessage || editingMessage) && (
        <View style={[styles.replyContainer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.primary }]}>
          <View style={styles.replyContent}>
            <Text style={[styles.replyLabel, { color: theme.colors.primary }]}>
              {editingMessage ? '✏️ Редактирование' : '↩️ Ответ'}
            </Text>
            <Text style={[styles.replyText, { color: theme.colors.secondaryText }]} numberOfLines={1}>
              {(editingMessage || replyToMessage)?.content}
            </Text>
          </View>
          <TouchableOpacity onPress={cancelReplyOrEdit}>
            <Text style={[styles.replyCancel, { color: theme.colors.secondaryText }]}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
        <MediaPicker onMediaSelected={handleMediaSelected} />
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.inputBackground, color: theme.colors.text }]}
          placeholder="Сообщение..."
          placeholderTextColor={theme.colors.secondaryText}
          value={inputText}
          onChangeText={handleTextChange}
          multiline
          maxLength={5000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          {editingMessage ? (
            <Text style={styles.sendButtonText}>✓</Text>
          ) : (
            <Image 
              source={require('../../assets/icons/send.png')} 
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
        <RecordButton 
          onVoiceSelected={handleVoiceSelected}
          onVideoNoteSelected={handleVideoNoteSelected}
        />
      </View>

      {/* Меню действий для сообщения */}
      <Modal
        visible={showMessageMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMessageMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMessageMenu(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: theme.colors.card }]}>
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.colors.border }]} onPress={handleReply}>
              <Text style={styles.menuIcon}>↩️</Text>
              <Text style={[styles.menuText, { color: theme.colors.text }]}>Ответить</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.colors.border }]} onPress={handleForward}>
              <Text style={styles.menuIcon}>➡️</Text>
              <Text style={[styles.menuText, { color: theme.colors.text }]}>Переслать</Text>
            </TouchableOpacity>
            {selectedMessage?.sender_id === user.id && (<><TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.colors.border }]} onPress={handleEdit}>
<Text style={styles.menuIcon}>✏️</Text>
<Text style={[styles.menuText, { color: theme.colors.text }]}>Редактировать</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.colors.border }]} onPress={handleDelete}>
<Text style={styles.menuIcon}>🗑️</Text>
<Text style={[styles.menuText, { color: theme.colors.text }]}>Удалить</Text>
</TouchableOpacity></>)}
            <View style={[styles.reactionRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.reactionLabel, { color: theme.colors.secondaryText }]}>Реакция:</Text>
              {['❤️', '👍', '😂', '😮', '😢', '🔥'].map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.reactionButton}
                  onPress={() => handleAddReaction(emoji)}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.menuItem, styles.cancelItem]}
              onPress={() => setShowMessageMenu(false)}
            >
              <Text style={[styles.menuText, { color: theme.colors.text }]}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDeleteModal(false)}
        >
          <View style={[styles.deleteModalContainer, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.deleteModalTitle, { color: theme.colors.text }]}>Удалить сообщение?</Text>
            {selectedMessage?.sender_id === user.id && (<TouchableOpacity
style={[styles.deleteModalButton, styles.deleteForAllButton]}
onPress={() => {
console.log('🗑️ Удалить для всех');
deleteMessage(true);
setShowDeleteModal(false);
}}
>
<Text style={styles.deleteModalButtonText}>Удалить для всех</Text>
</TouchableOpacity>)}
            <TouchableOpacity
              style={[styles.deleteModalButton, styles.deleteForMeButton]}
              onPress={() => {
                console.log('🗑️ Удалить для себя');
                deleteMessage(false);
                setShowDeleteModal(false);
              }}
            >
              <Text style={styles.deleteModalButtonText}>Удалить для себя</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteModalButton, styles.cancelDeleteButton]}
              onPress={() => setShowDeleteModal(false)}
            >
              <Text style={[styles.deleteModalButtonText, { color: theme.colors.primary }]}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Модал пересылки сообщения */}
      <Modal
        visible={showForwardModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowForwardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.forwardModalContainer, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.forwardModalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.forwardModalTitle, { color: theme.colors.text }]}>
                Переслать сообщение
              </Text>
              <TouchableOpacity onPress={() => setShowForwardModal(false)}>
                <Text style={{ fontSize: 24, color: theme.colors.secondaryText }}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={forwardChats}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const chatName = item.type === 'group'
                  ? item.name
                  : item.members?.find(m => m.id !== user.id)?.username || 'Чат';
                return (
                  <TouchableOpacity
                    style={[styles.forwardChatItem, { borderBottomColor: theme.colors.border }]}
                    onPress={() => forwardToChat(item.id)}
                  >
                    <View style={[styles.forwardChatAvatar, { backgroundColor: theme.colors.primary }]}>
                      <Text style={styles.forwardChatAvatarText}>
                        {chatName?.[0]?.toUpperCase() || '?'}
                      </Text>
                    </View>
                    <Text style={[styles.forwardChatName, { color: theme.colors.text }]}>
                      {chatName}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={[styles.forwardEmptyText, { color: theme.colors.secondaryText }]}>
                  Нет доступных чатов
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
      {/* Экран звонка */}
      <CallScreen
        visible={isCallActive || incomingCall !== null}
        isIncoming={incomingCall !== null}
        isVideo={incomingCall ? incomingCall.isVideo : false}
        callerName={incomingCall ? incomingCall.callerName : chatName}
        onAccept={() => answerCall(incomingCall)}
        onDecline={() => declineCall(incomingCall.callId)}
        onEnd={endCall}
        localStream={localStream}
        remoteStream={remoteStream}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  replyContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#F0F0F0',
    borderTopWidth: 3,
    borderTopColor: '#007AFF',
    alignItems: 'center'
  },
  replyContent: {
    flex: 1
  },
  replyLabel: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 2
  },
  replyText: {
    fontSize: 14,
    color: '#666'
  },
  replyCancel: {
    fontSize: 20,
    color: '#666',
    padding: 8
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 10,
    maxHeight: 100,
    fontSize: 16
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc'
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600'
  },
  typingContainer: {
    padding: 10,
    paddingLeft: 15
  },
  typingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 10,
    paddingBottom: 40
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 12
  },
  menuText: {
    fontSize: 17,
    color: '#000'
  },
  reactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  reactionLabel: {
    fontSize: 15,
    color: '#666',
    marginRight: 12
  },
  reactionButton: {
    padding: 8,
    marginHorizontal: 4
  },
  reactionEmoji: {
    fontSize: 24
  },
  cancelItem: {
    borderBottomWidth: 0,
    justifyContent: 'center',
    marginTop: 8
  },
  deleteModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 320,
    alignItems: 'stretch'
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  deleteModalButton: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: 'center'
  },
  deleteForAllButton: {
    backgroundColor: '#FF3B30'
  },
  deleteForMeButton: {
    backgroundColor: '#FF9500'
  },
  cancelDeleteButton: {
    backgroundColor: 'transparent'
  },
  deleteModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  },
  forwardModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    marginTop: 'auto'
  },
  forwardModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  forwardModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000'
  },
  forwardChatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  forwardChatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  forwardChatAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  },
  forwardChatName: {
    fontSize: 16,
    color: '#000'
  },
  forwardEmptyText: {
    textAlign: 'center',
    padding: 40,
    fontSize: 16,
    color: '#999'
  }
});
