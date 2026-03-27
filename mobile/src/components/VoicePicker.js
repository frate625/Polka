// Компонент для записи голосовых сообщений
import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Text,
  Platform,
  Alert
} from 'react-native';
import { uploadAPI } from '../services/api';

const VoicePicker = forwardRef(({ onVoiceSelected, onCancel }, ref) => {
  const [isRecording, setIsRecording] = useState(false);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const isCancelledRef = useRef(false);

  // Expose startRecording to parent via ref
  useImperativeHandle(ref, () => ({
    startRecording: () => {
      startRecording();
    }
  }));

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      Alert.alert('Ошибка', 'Запись голоса недоступна на этом устройстве');
      return;
    }

    isCancelledRef.current = false;

    try {
      // Запрашиваем доступ к микрофону
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });

      streamRef.current = stream;
      setShowRecordingModal(true);

      // Создаем MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Останавливаем микрофон
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => {
            track.stop();
            console.log('Микрофон остановлен');
          });
          streamRef.current = null;
        }

        setShowRecordingModal(false);
        setRecordingTime(0);

        // Проверяем - если отменено, НЕ загружаем!
        if (isCancelledRef.current) {
          console.log('🚫 Запись отменена, аудио не отправляется');
          isCancelledRef.current = false;
          chunksRef.current = [];
          return;
        }

        // Загружаем только если НЕ отменено
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await uploadVoice(blob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      // Таймер
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;

          // Максимум 5 минут
          if (newTime >= 300) {
            stopRecording();
          }

          return newTime;
        });
      }, 1000);

    } catch (error) {
      console.error('Ошибка доступа к микрофону:', error);
      Alert.alert('Ошибка', 'Не удалось получить доступ к микрофону');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    console.log('🚫 Отмена записи голосового');

    // Устанавливаем флаг отмены ДО остановки
    isCancelledRef.current = true;

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    // Останавливаем микрофон
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setShowRecordingModal(false);
    setRecordingTime(0);
    
    // Уведомляем родителя
    if (onCancel) {
      onCancel();
    }
  };

  const uploadVoice = async (blob) => {
    try {
      const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });

      console.log('📤 Загрузка голосового...', file.name);
      const response = await uploadAPI.uploadWebFile(file);
      console.log('📥 Ответ сервера:', response.data);

      const fileUrl = response.data.file?.url || response.data.url;

      if (!fileUrl) {
        console.error('❌ URL файла не найден в ответе:', response.data);
        Alert.alert('Ошибка', 'Не удалось получить URL аудио');
        return;
      }

      console.log('✅ Голосовое загружено:', fileUrl);

      if (onVoiceSelected) {
        onVoiceSelected({
          url: fileUrl,
          name: file.name,
          size: file.size,
          type: 'voice'
        });
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки голосового:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить аудио');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Modal
        visible={showRecordingModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelRecording}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.recordingContainer}>
            <View style={styles.microphoneIcon}>
              <Text style={styles.microphoneText}>🎤</Text>
              {isRecording && <View style={styles.recordingIndicator} />}
            </View>
            <View style={styles.controls}>
              <Text style={styles.timer}>{formatTime(recordingTime)}</Text>
              <Text style={styles.maxTime}>/ 5:00</Text>
            </View>
            <Text style={styles.hint}>
              {isRecording ? '🔴 Запись...' : 'Подготовка...'}
            </Text>
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.controlButton, styles.cancelButton]}
                onPress={cancelRecording}
              >
                <Text style={styles.controlButtonText}>✕</Text>
              </TouchableOpacity>
              {isRecording && (
                <TouchableOpacity
                  style={[styles.controlButton, styles.stopButton]}
                  onPress={stopRecording}
                >
                  <Text style={styles.controlButtonText}>■</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  recordingContainer: {
    alignItems: 'center'
  },
  microphoneIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative'
  },
  microphoneText: {
    fontSize: 60
  },
  recordingIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30'
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20
  },
  timer: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'monospace'
  },
  maxTime: {
    fontSize: 24,
    color: '#999',
    marginLeft: 8
  },
  hint: {
    fontSize: 14,
    color: '#999',
    marginBottom: 30
  },
  buttons: {
    flexDirection: 'row'
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10
  },
  cancelButton: {
    backgroundColor: '#666'
  },
  stopButton: {
    backgroundColor: '#FF3B30'
  },
  controlButtonText: {
    fontSize: 30,
    color: '#fff',
    fontWeight: 'bold'
  }
});

export default VoicePicker;
