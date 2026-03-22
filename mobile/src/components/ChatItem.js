// Компонент для отображения элемента чата в списке
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function ChatItem({ chat, onPress, theme }) {
  // Получение последнего сообщения
  const lastMessage = chat.messages?.[0];
  const lastMessageText = lastMessage?.content || 'Нет сообщений';
  
  // Проверка онлайн статуса (для приватных чатов)
  const isOnline = chat.type === 'private' && chat.members?.some(m => m.is_online);
  
  // Форматирование времени
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // Если сегодня - показываем время
    if (diff < 86400000) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    // Если вчера или раньше - показываем дату
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  };

  const bgColor = theme?.colors?.card || '#fff';
  const borderColor = theme?.colors?.border || '#f0f0f0';
  const textColor = theme?.colors?.text || '#000';
  const secondaryTextColor = theme?.colors?.secondaryText || '#666';
  const primaryColor = theme?.colors?.primary || '#007AFF';

  return (
    <TouchableOpacity style={[styles.container, { backgroundColor: bgColor, borderBottomColor: borderColor }]} onPress={onPress}>
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: primaryColor }]}>
          <Text style={styles.avatarText}>
            {chat.name?.[0]?.toUpperCase() || chat.members?.[0]?.username?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        {isOnline && <View style={[styles.onlineIndicator, { borderColor: bgColor }]} />}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>
            {chat.name || chat.members?.find(m => m.id !== chat.user_id)?.username || 'Чат'}
          </Text>
          <Text style={[styles.time, { color: secondaryTextColor }]}>
            {formatTime(chat.last_message_at)}
          </Text>
        </View>
        <View style={styles.footer}>
          <Text style={[styles.lastMessage, { color: secondaryTextColor }]} numberOfLines={1}>
            {lastMessageText}
          </Text>
          {chat.unread_count > 0 && (
            <View style={[styles.badge, { backgroundColor: primaryColor }]}>
              <Text style={styles.badgeText}>{chat.unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff'
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CD964',
    borderWidth: 2,
    borderColor: '#fff'
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600'
  },
  content: {
    flex: 1,
    justifyContent: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1
  },
  time: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1
  },
  badge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  }
});
