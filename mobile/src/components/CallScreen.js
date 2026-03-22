// Экран звонка (аудио/видео)
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform
} from 'react-native';

export default function CallScreen({ 
  visible, 
  isIncoming, 
  isVideo,
  callerName,
  onAccept,
  onDecline,
  onEnd,
  localStream,
  remoteStream
}) {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideo);
  const timerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Таймер звонка
  useEffect(() => {
    if (visible && !isIncoming && remoteStream) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [visible, isIncoming, remoteStream]);

  // Подключаем видео потоки
  useEffect(() => {
    if (Platform.OS === 'web') {
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }
  }, [localStream, remoteStream]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  return (
    <Modal visible={visible} transparent={false} animationType="fade">
      <View style={styles.container}>
        {/* Видео */}
        {isVideo && Platform.OS === 'web' && (
          <View style={styles.videoContainer}>
            {/* Удаленное видео (большое) */}
            {remoteStream && (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={styles.remoteVideo}
              />
            )}
            
            {/* Локальное видео (маленькое) */}
            {localStream && (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={styles.localVideo}
              />
            )}
          </View>
        )}

        {/* Информация о звонке */}
        <View style={styles.infoContainer}>
          <Text style={styles.callerName}>{callerName}</Text>
          {isIncoming ? (
            <Text style={styles.status}>Входящий {isVideo ? 'видео' : 'аудио'} звонок...</Text>
          ) : remoteStream ? (
            <Text style={styles.status}>{formatDuration(callDuration)}</Text>
          ) : (
            <Text style={styles.status}>Соединение...</Text>
          )}
        </View>

        {/* Кнопки управления */}
        <View style={styles.controls}>
          {isIncoming ? (
            // Входящий звонок - Принять / Отклонить
            <>
              <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={onAccept}>
                <Text style={styles.buttonText}>📞</Text>
                <Text style={styles.buttonLabel}>Принять</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.declineButton]} onPress={onDecline}>
                <Text style={styles.buttonText}>✕</Text>
                <Text style={styles.buttonLabel}>Отклонить</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Активный звонок - Управление
            <>
              <TouchableOpacity 
                style={[styles.button, isMuted ? styles.mutedButton : styles.controlButton]} 
                onPress={toggleMute}
              >
                <Text style={styles.buttonText}>{isMuted ? '🔇' : '🎤'}</Text>
                <Text style={styles.buttonLabel}>Микрофон</Text>
              </TouchableOpacity>
              
              {isVideo && (
                <TouchableOpacity 
                  style={[styles.button, !isVideoEnabled ? styles.mutedButton : styles.controlButton]} 
                  onPress={toggleVideo}
                >
                  <Text style={styles.buttonText}>{isVideoEnabled ? '📹' : '🚫'}</Text>
                  <Text style={styles.buttonLabel}>Камера</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={[styles.button, styles.endButton]} onPress={onEnd}>
                <Text style={styles.buttonText}>📵</Text>
                <Text style={styles.buttonLabel}>Завершить</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60
  },
  videoContainer: {
    flex: 1,
    width: '100%',
    position: 'relative'
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    backgroundColor: '#000'
  },
  localVideo: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 120,
    height: 160,
    objectFit: 'cover',
    borderRadius: 12,
    border: '2px solid #fff'
  },
  infoContainer: {
    alignItems: 'center',
    marginVertical: 40
  },
  callerName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12
  },
  status: {
    fontSize: 18,
    color: '#999'
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10
  },
  acceptButton: {
    backgroundColor: '#4CAF50'
  },
  declineButton: {
    backgroundColor: '#F44336'
  },
  endButton: {
    backgroundColor: '#F44336'
  },
  controlButton: {
    backgroundColor: '#555'
  },
  mutedButton: {
    backgroundColor: '#333'
  },
  buttonText: {
    fontSize: 32,
    marginBottom: 4
  },
  buttonLabel: {
    fontSize: 11,
    color: '#fff',
    marginTop: 4
  }
});
