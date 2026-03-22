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
  Modal
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { messageAPI } from '../services/api';
import { useSocket } from '../store/SocketContext';
import { useAuth } from '../store/AuthContext';
import { useTheme } from '../store/ThemeContext';
import MessageItem from '../components/MessageItem';
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
  const recipientId = chatType === 'personal' && chatMembers 
    ? chatMembers.find(m => m.user_id !== user.id)?.user_id 
    : null;

  // Настройка header с кнопками
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', marginRight: 10 }}>
          {/* Кнопки звонков (только для персональных чатов) */}
          {chatType === 'personal' && recipientId && (
            <>
              <TouchableOpacity
                style={{ padding: 5, marginHorizontal: 5 }}
                onPress={() => makeCall(chatId, recipientId, false)}
              >
                <Text style={{ color: '#007AFF', fontSize: 20 }}>📞</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ padding: 5, marginHorizontal: 5 }}
                onPress={() => makeCall(chatId, recipientId, true)}
              >
                <Text style={{ color: '#007AFF', fontSize: 20 }}>📹</Text>
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
            <Text style={{ color: '#007AFF', fontSize: 20 }}>ℹ️</Text>
          </TouchableOpacity>
          {chatType === 'group' && (
            <TouchableOpacity
              style={{ padding: 5, marginHorizontal: 5 }}
              onPress={() => navigation.navigate('GroupManage', {
                chatId,
                currentMembers: chatMembers || []
              })}
            >
              <Text style={{ color: '#007AFF', fontSize: 20 }}>⚙️</Text>
            </TouchableOpacity>
          )}
        </View>
      )
    });
  }, [chatType, chatId, chatMembers, chatName]);

  // Загрузка сообщений при открытии чата
  useEffect(() => {
    loadMessages();
    
    socket.joinChat(chatId);
    socket.on('new_message', handleNewMessage);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('reaction_added', handleReactionAdded);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      Alert.alert('Ошибка', error.message || 'Произошла ошибка');
    });

    return () => {
      socket.leaveChat(chatId);
      socket.off('new_message', handleNewMessage);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('reaction_added', handleReactionAdded);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
      socket.off('error');
    };
  }, [chatId]);

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

  const handleNewMessage = useCallback((message) => {
    if (message.chat_id === chatId) {
      setMessages((prev) => [...prev, message]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [chatId]);

  const handleMessageEdited = useCallback((data) => {
    if (data.chatId === chatId) {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId ? { ...msg, content: data.content, edited: true } : msg
      ));
    }
  }, [chatId]);

  const handleMessageDeleted = useCallback((data) => {
    if (data.chatId === chatId) {
      setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
    }
  }, [chatId]);

  const handleReactionAdded = useCallback((data) => {
    if (data.chatId === chatId) {
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
  }, [chatId]);

  const handleUserTyping = useCallback((data) => {
    if (data.chatId === chatId && data.userId !== user.id) {
      setTypingUsers((prev) => {
        if (!prev.includes(data.username)) {
          return [...prev, data.username];
        }
        return prev;
      });
    }
  }, [chatId, user.id]);

  const handleUserStoppedTyping = useCallback((data) => {
    if (data.chatId === chatId) {
      setTypingUsers((prev) => prev.filter((name) => name !== data.username));
    }
  }, [chatId]);

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
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageItem
            message={item}
            isOwnMessage={item.sender_id === user.id}
            onLongPress={() => handleMessageLongPress(item)}
            theme={theme}
          />
        )}
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
          <Text style={styles.sendButtonText}>
            {editingMessage ? '✓' : '➤'}
          </Text>
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
  }
});
