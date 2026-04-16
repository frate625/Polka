// Компонент для записи видео-кружочков (как в Telegram)
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

const VideoNotePicker = forwardRef(({ onVideoNoteSelected, onCancel }, ref) => {
  const [isRecording, setIsRecording] = useState(false);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const isCancelledRef = useRef(false);

  // Expose startRecording to parent via ref
  useImperativeHandle(ref, () => ({
    startRecording: () => {
      startRecording();
    }
  }));

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      Alert.alert('Ошибка', 'Запись видео недоступна на этом устройстве');
      return;
    }

    // Сбрасываем флаг отмены
    isCancelledRef.current = false;

    try {
      // Запрашиваем доступ к камере
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 384 },
          height: { ideal: 384 },
          facingMode: 'user'
        },
        audio: true
      });

      streamRef.current = stream;
      
      setShowRecordingModal(true);
      
      // Показываем превью (создаем video элемент через DOM)
      setTimeout(() => {
        if (videoContainerRef.current && streamRef.current) {
          // Создаем video элемент
          const videoElement = document.createElement('video');
          videoElement.autoplay = true;
          videoElement.playsInline = true;
          videoElement.muted = true;
          videoElement.style.width = '100%';
          videoElement.style.height = '100%';
          videoElement.style.borderRadius = '50%';
          videoElement.style.objectFit = 'cover';
          videoElement.style.transform = 'scaleX(-1)';
          videoElement.style.backgroundColor = '#000';
          videoElement.srcObject = streamRef.current;
          
          // Очищаем контейнер и добавляем видео
          videoContainerRef.current.innerHTML = '';
          videoContainerRef.current.appendChild(videoElement);
          
          videoRef.current = videoElement;
          videoElement.play().catch(err => console.log('Play error:', err));
        }
      }, 100);

      // Формат записи: на мобильных сначала VP8 (лучше крутится в WebView/«телефонном» Chrome),
      // на десктопе — VP9 для качества.
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const isMobileBrowser = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);

      const pickMimeType = () => {
        const candidates = isMobileBrowser
          ? [
              'video/webm;codecs=vp8,opus',
              'video/webm;codecs=vp9,opus',
              'video/webm',
              'video/mp4',
              ''
            ]
          : [
              'video/webm;codecs=vp9,opus',
              'video/webm;codecs=vp8,opus',
              'video/webm',
              'video/mp4',
              ''
            ];
        for (const c of candidates) {
          if (c === '' || MediaRecorder.isTypeSupported(c)) {
            return c;
          }
        }
        return '';
      };

      let mimeType = pickMimeType();

      console.log('📹 Используемый формат видео:', mimeType || 'default', isMobileBrowser ? '(mobile)' : '(desktop)');

      // Создаем MediaRecorder
      const mediaRecorder = mimeType 
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const usedMime = mediaRecorder.mimeType || mimeType || 'video/webm';

        // Останавливаем камеру СРАЗУ
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => {
            track.stop();
            console.log('Камера остановлена');
          });
          streamRef.current = null;
        }
        
        // Очищаем видео элемент
        if (videoRef.current && videoRef.current.srcObject) {
          videoRef.current.srcObject = null;
        }
        
        // Очищаем контейнер
        if (videoContainerRef.current) {
          videoContainerRef.current.innerHTML = '';
        }
        
        videoRef.current = null;
        
        setShowRecordingModal(false);
        setRecordingTime(0);
        
        // Проверяем - если отменено, НЕ загружаем!
        if (isCancelledRef.current) {
          console.log('🚫 Запись отменена, видео не отправляется');
          isCancelledRef.current = false; // Сбрасываем флаг
          chunksRef.current = []; // Очищаем chunks
          return;
        }
        
        // Blob и имя файла должны совпадать с реальным кодеком (иначе MP4 внутри .webm ломает плеер на телефоне)
        const blob = new Blob(chunksRef.current, { type: usedMime });
        const ext = usedMime.includes('mp4') ? 'mp4' : 'webm';
        await uploadVideoNote(blob, usedMime, ext);
      };

      mediaRecorderRef.current = mediaRecorder;
      
      try {
        console.log('▶️ Запуск VideoRecorder...');
        // timeslice: часть Android/WebKit не отдаёт данные в ondataavailable без интервала
        mediaRecorder.start(250);
        setIsRecording(true);
        console.log('✅ VideoRecorder запущен, состояние:', mediaRecorder.state);
      } catch (startError) {
        console.error('❌ Ошибка запуска VideoRecorder:', startError);
        Alert.alert('Ошибка', 'Не удалось начать запись видео: ' + startError.message);
        
        // Останавливаем поток
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Очищаем видео
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current = null;
        }
        if (videoContainerRef.current) {
          videoContainerRef.current.innerHTML = '';
        }
        
        setShowRecordingModal(false);
        return;
      }

      // Таймер
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          
          // Максимум 60 секунд
          if (newTime >= 60) {
            stopRecording();
          }
          
          return newTime;
        });
      }, 1000);

    } catch (error) {
      console.error('❌ Ошибка доступа к камере:', error);
      
      // Закрываем модалку если она была открыта
      setShowRecordingModal(false);
      setIsRecording(false);
      
      // Останавливаем поток если он был создан
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Очищаем видео элементы
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current = null;
      }
      if (videoContainerRef.current) {
        videoContainerRef.current.innerHTML = '';
      }
      
      let errorMessage = 'Не удалось получить доступ к камере';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Доступ к камере запрещен. Разрешите доступ в настройках браузера.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Камера не найдена';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Камера используется другим приложением';
      }
      
      Alert.alert('Ошибка', errorMessage);
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
    console.log('🚫 Отмена записи');
    
    // ВАЖНО: Устанавливаем флаг отмены ДО остановки записи
    isCancelledRef.current = true;
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    // Останавливаем камеру
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Очищаем видео элемент
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
    }
    
    // Очищаем контейнер
    if (videoContainerRef.current) {
      videoContainerRef.current.innerHTML = '';
    }
    
    videoRef.current = null;

    setShowRecordingModal(false);
    setRecordingTime(0);
    
    // Уведомляем родителя
    if (onCancel) {
      onCancel();
    }
  };

  const uploadVideoNote = async (blob, mimeType = 'video/webm', ext = 'webm') => {
    try {
      const file = new File([blob], `video_note_${Date.now()}.${ext}`, { type: mimeType });
      
      console.log('📤 Загрузка кружочка...', file.name);
      const response = await uploadAPI.uploadWebFile(file);
      console.log('📥 Ответ сервера:', response.data);
      
      // Получаем URL - может быть response.data.url или response.data.file.url
      const fileUrl = response.data.file?.url || response.data.url;
      
      if (!fileUrl) {
        console.error('❌ URL файла не найден в ответе:', response.data);
        Alert.alert('Ошибка', 'Не удалось получить URL видео');
        return;
      }
      
      console.log('✅ Кружочек загружен:', fileUrl);
      
      if (onVideoNoteSelected) {
        onVideoNoteSelected({
          url: fileUrl,
          name: file.name,
          size: file.size,
          type: 'video_note'
        });
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки кружочка:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить видео');
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
            <View style={styles.videoContainer}>
              {Platform.OS === 'web' && (
                <div ref={videoContainerRef} style={{ width: '100%', height: '100%' }} />
              )}
            </View>
            <View style={styles.controls}>
              <Text style={styles.timer}>{formatTime(recordingTime)}</Text>
              <Text style={styles.maxTime}>/ 1:00</Text>
            </View>

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

            <Text style={styles.hint}>
              {isRecording ? '⏺ Запись...' : 'Подготовка...'}
            </Text>
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
  videoContainer: {
    width: 300,
    height: 300,
    borderRadius: 150,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 30
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 30
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
  buttons: {
    flexDirection: 'row',
    marginBottom: 20
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
  },
  hint: {
    fontSize: 14,
    color: '#999',
    marginTop: 10
  }
});

export default VideoNotePicker;
