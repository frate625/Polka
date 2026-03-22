// Компонент для отображения одного сообщения в чате
import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, Platform } from 'react-native';
import { getBaseUrl } from '../services/api';

export default function MessageItem({ message, isOwnMessage, onLongPress }) {
  const audioRef = useRef(null);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return '📄';
    const ext = fileName.split('.').pop().toLowerCase();
    
    const iconMap = {
      pdf: '📕', doc: '📘', docx: '📘', xls: '📗', xlsx: '📗',
      ppt: '📙', pptx: '📙', txt: '📝', zip: '🗜️', rar: '🗜️',
      mp3: '🎵', mp4: '🎬', avi: '🎬', jpg: '🖼️', jpeg: '🖼️',
      png: '🖼️', gif: '🖼️', webm: '🎤'
    };
    
    return iconMap[ext] || '📄';
  };

  const openFile = (url) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const downloadFile = (url, fileName) => {
    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Linking.openURL(url);
    }
  };

  // Обнаружение ссылок в тексте
  const detectLinks = (text) => {
    if (!text) return [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  const renderLinkPreview = (url) => {
    let displayUrl = url;
    let domain = '';
    
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname;
      displayUrl = url.length > 50 ? url.substring(0, 47) + '...' : url;
    } catch (e) {
      displayUrl = url.length > 50 ? url.substring(0, 47) + '...' : url;
    }

    return (
      <TouchableOpacity
        key={url}
        style={[styles.linkPreview, isOwnMessage && styles.linkPreviewOwn]}
        onPress={() => openFile(url)}
        activeOpacity={0.7}
      >
        <View style={styles.linkIconContainer}>
          <Text style={styles.linkIcon}>🔗</Text>
        </View>
        <View style={styles.linkTextContainer}>
          {domain && (
            <Text style={[styles.linkDomain, isOwnMessage && styles.ownTextSecondary]} numberOfLines={1}>
              {domain}
            </Text>
          )}
          <Text style={[styles.linkUrl, isOwnMessage && styles.ownTextSecondary]} numberOfLines={1}>
            {displayUrl}
          </Text>
        </View>
        <Text style={[styles.linkArrow, isOwnMessage && styles.ownTextSecondary]}>→</Text>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <TouchableOpacity onPress={() => openFile(message.file_url)} activeOpacity={0.8}>
            <Image source={{ uri: message.file_url }} style={styles.image} resizeMode="cover" />
            {message.content && (
              <Text style={[styles.messageText, isOwnMessage && styles.ownText]}>
                {message.content}
              </Text>
            )}
          </TouchableOpacity>
        );

      case 'voice':
        const audioUrl = message.file_url?.startsWith('http') 
          ? message.file_url 
          : `${getBaseUrl()}${message.file_url}`;
        
        return (
          <View style={styles.voiceContainer}>
            {Platform.OS === 'web' ? (
              <audio 
                ref={audioRef} 
                controls 
                src={audioUrl}
                style={{ 
                  width: '100%', 
                  height: 32,
                  borderRadius: 16
                }}
              >
                Ваш браузер не поддерживает аудио.
              </audio>
            ) : (
              <TouchableOpacity style={styles.voiceButton} onPress={() => openFile(audioUrl)}>
                <Text style={[styles.voiceText, isOwnMessage && styles.ownText]}>
                  ▶️ Голосовое сообщение
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'video':
        return (
          <TouchableOpacity style={styles.fileContainer} onPress={() => openFile(message.file_url)} activeOpacity={0.7}>
            <Text style={styles.fileIcon}>🎬</Text>
            <View style={styles.fileInfo}>
              <Text style={[styles.fileName, isOwnMessage && styles.ownText]}>
                {message.file_name || 'Видео'}
              </Text>
              {message.file_size && (
                <Text style={[styles.fileSize, isOwnMessage && styles.ownTextSecondary]}>
                  {formatFileSize(message.file_size)}
                </Text>
              )}
            </View>
            <Text style={[styles.downloadIcon, isOwnMessage && styles.ownText]}>⬇️</Text>
          </TouchableOpacity>
        );

      case 'video_note':
        if (!message.file_url) {
          console.error('❌ Video note: file_url is null or undefined');
          return (
            <View style={styles.videoNoteContainer}>
              <Text style={[styles.errorText, isOwnMessage && styles.ownText]}>
                Ошибка загрузки видео
              </Text>
            </View>
          );
        }
        
        const videoUrl = message.file_url.startsWith('http') 
          ? message.file_url 
          : `${getBaseUrl()}${message.file_url}`;
        
        console.log('🎥 Video note URL:', videoUrl);
        
        return (
          <View style={styles.videoNoteContainer}>
            {Platform.OS === 'web' ? (
              <video
                src={videoUrl}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                onClick={(e) => {
                  const video = e.target;
                  // Перематываем на начало
                  video.currentTime = 0;
                  // Убираем зацикливание
                  video.loop = false;
                  // Включаем звук
                  video.muted = false;
                  // Воспроизводим
                  video.play();
                }}
                onEnded={(e) => {
                  const video = e.target;
                  // После окончания возвращаем зацикливание и без звука
                  video.loop = true;
                  video.muted = true;
                  video.play();
                }}
                onError={(e) => console.error('❌ Video error:', e)}
                onLoadedData={() => console.log('✅ Video loaded')}
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  backgroundColor: '#000',
                  cursor: 'pointer',
                  display: 'block',
                  border: 'none',
                  outline: 'none'
                }}
              />
            ) : (
              <TouchableOpacity 
                style={styles.videoNotePlaceholder}
                onPress={() => openFile(videoUrl)}
              >
                <Text style={styles.videoNoteIcon}>⭕</Text>
                <Text style={[styles.videoNoteText, isOwnMessage && styles.ownText]}>
                  Видео-сообщение
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'file':
        return (
          <TouchableOpacity
            style={styles.fileContainer}
            onPress={() => downloadFile(message.file_url, message.file_name)}
            activeOpacity={0.7}
          >
            <Text style={styles.fileIcon}>{getFileIcon(message.file_name)}</Text>
            <View style={styles.fileInfo}>
              <Text style={[styles.fileName, isOwnMessage && styles.ownText]} numberOfLines={2}>
                {message.file_name || 'Файл'}
              </Text>
              {message.file_size && (
                <Text style={[styles.fileSize, isOwnMessage && styles.ownTextSecondary]}>
                  {formatFileSize(message.file_size)}
                </Text>
              )}
            </View>
            <Text style={[styles.downloadIcon, isOwnMessage && styles.ownText]}>⬇️</Text>
          </TouchableOpacity>
        );

      default:
        const links = detectLinks(message.content);
        return (
          <>
            <Text style={[styles.messageText, isOwnMessage && styles.ownText]}>
              {message.content}
            </Text>
            {links.length > 0 && (
              <View style={styles.linksContainer}>
                {links.map(link => renderLinkPreview(link))}
              </View>
            )}
          </>
        );
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={() => onLongPress && onLongPress(message)}
      delayLongPress={500}
    >
      <View style={[styles.container, isOwnMessage && styles.ownMessage]}>
        {!isOwnMessage && message.sender && (
          <Text style={styles.senderName}>{message.sender.username}</Text>
        )}
        {message.reply_to && (
          <View style={styles.replyIndicator}>
            <View style={styles.replyLine} />
            <View style={styles.replyContent}>
              <Text style={[styles.replyUsername, isOwnMessage && styles.ownTextSecondary]}>
                {message.reply_to.sender?.username || 'Пользователь'}
              </Text>
              <Text style={[styles.replyText, isOwnMessage && styles.ownTextSecondary]} numberOfLines={1}>
                {message.reply_to.content || 'Медиа'}
              </Text>
            </View>
          </View>
        )}
        <View style={[
          (message.type === 'video_note' || message.type === 'voice') ? styles.videoNoteBubble : styles.bubble,
          (message.type !== 'video_note' && message.type !== 'voice') && (isOwnMessage ? styles.ownBubble : styles.otherBubble)
        ]}>
          {renderContent()}
          {message.reactions && message.reactions.length > 0 && (
            <View style={styles.reactionsContainer}>
              {message.reactions.map((reaction, index) => (
                <View key={index} style={styles.reactionBadge}>
                  <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                  <Text style={styles.reactionCount}>{reaction.count}</Text>
                </View>
              ))}
            </View>
          )}
          {(message.type !== 'video_note' && message.type !== 'voice') && (
            <View style={styles.footer}>
              <Text style={[styles.time, isOwnMessage && styles.ownTime]}>
                {formatTime(message.created_at)}
                {message.edited && ' (изм.)'}
              </Text>
              {isOwnMessage && (
                <Text style={styles.status}>
                  {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 10,
    maxWidth: '80%',
    alignSelf: 'flex-start'
  },
  ownMessage: {
    alignSelf: 'flex-end'
  },
  senderName: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 2,
    marginLeft: 10,
    fontWeight: '500'
  },
  replyIndicator: {
    flexDirection: 'row',
    marginBottom: 4,
    marginLeft: 10,
    opacity: 0.8
  },
  replyLine: {
    width: 3,
    backgroundColor: '#007AFF',
    borderRadius: 2,
    marginRight: 8
  },
  replyContent: {
    flex: 1
  },
  replyUsername: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2
  },
  replyText: {
    fontSize: 13,
    color: '#666'
  },
  bubble: {
    padding: 10,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4
  },
  ownBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4
  },
  videoNoteBubble: {
    padding: 0,
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0
  },
  messageText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 22
  },
  ownText: {
    color: '#fff'
  },
  ownTextSecondary: {
    color: 'rgba(255, 255, 255, 0.8)'
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
    backgroundColor: '#f0f0f0'
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 200
  },
  voiceIcon: {
    fontSize: 20,
    marginRight: 8
  },
  voiceButton: {
    flex: 1
  },
  voiceText: {
    fontSize: 15,
    color: '#000'
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    minWidth: 220
  },
  fileIcon: {
    fontSize: 32,
    marginRight: 12
  },
  fileInfo: {
    flex: 1,
    marginRight: 12
  },
  fileName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2
  },
  fileSize: {
    fontSize: 12,
    color: '#666'
  },
  downloadIcon: {
    fontSize: 20,
    color: '#007AFF'
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: -4
  },
  reactionBadge: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 4,
    marginBottom: 4,
    alignItems: 'center'
  },
  reactionEmoji: {
    fontSize: 14,
    marginRight: 2
  },
  reactionCount: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500'
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end'
  },
  time: {
    fontSize: 11,
    color: '#666',
    marginRight: 4
  },
  ownTime: {
    color: 'rgba(255, 255, 255, 0.8)'
  },
  status: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)'
  },
  linksContainer: {
    marginTop: 8
  },
  linkPreview: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    alignItems: 'center'
  },
  linkPreviewOwn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  linkIconContainer: {
    marginRight: 10
  },
  linkIcon: {
    fontSize: 24
  },
  linkTextContainer: {
    flex: 1
  },
  linkDomain: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2
  },
  linkUrl: {
    fontSize: 11,
    color: '#666'
  },
  linkArrow: {
    fontSize: 18,
    color: '#007AFF',
    marginLeft: 8
  },
  videoNoteContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0
  },
  videoNotePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  videoNoteIcon: {
    fontSize: 60,
    marginBottom: 10
  },
  videoNoteText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center'
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    padding: 10
  }
});
