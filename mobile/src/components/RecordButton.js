// Единая кнопка записи (голосовое/кружочек) как в Telegram
import React, { useState, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Alert,
  Image
} from 'react-native';
import VoicePicker from './VoicePicker';
import VideoNotePicker from './VideoNotePicker';

export default function RecordButton({ onVoiceSelected, onVideoNoteSelected }) {
  const [mode, setMode] = useState('instagram'); // 'instagram' или 'video_note'
  const [isRecording, setIsRecording] = useState(false);
  const pressStartTime = useRef(null);
  const longPressTimer = useRef(null);
  const voicePickerRef = useRef(null);
  const videoNotePickerRef = useRef(null);

  const handlePressIn = () => {
    pressStartTime.current = Date.now();
    
    // Запускаем таймер на 1 секунду
    longPressTimer.current = setTimeout(() => {
      // Долгое нажатие - начать запись
      console.log(`🔴 Долгое нажатие - начинаем запись ${mode}`);
      startRecording();
    }, 1000);
  };

  const handlePressOut = () => {
    const pressDuration = Date.now() - pressStartTime.current;
    
    // Отменяем таймер
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Если нажатие было коротким (<1 сек) и не идет запись
    if (pressDuration < 1000 && !isRecording) {
      // Переключаем режим
      const newMode = mode === 'instagram' ? 'video_note' : 'instagram';
      console.log(`🔄 Переключение режима: ${mode} → ${newMode}`);
      setMode(newMode);
    }
  };

  const startRecording = () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Ошибка', 'Запись доступна только в веб-версии');
      return;
    }

    setIsRecording(true);
    
    // Если в режиме instagram - записываем голос
    // Если в режиме video_note - записываем видео-кружок
    if (mode === 'instagram') {
      if (voicePickerRef.current) {
        voicePickerRef.current.startRecording();
      }
    } else {
      if (videoNotePickerRef.current) {
        videoNotePickerRef.current.startRecording();
      }
    }
  };

  const handleRecordingComplete = () => {
    setIsRecording(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
      >
        <Image 
          source={mode === 'instagram' 
            ? require('../../assets/icons/instagram.png')
            : require('../../assets/icons/video-note.png')
          }
          style={{ width: 28, height: 28 }}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Скрытые пикеры - управляются через ref */}
      <VoicePicker
        ref={voicePickerRef}
        onVoiceSelected={(data) => {
          handleRecordingComplete();
          onVoiceSelected(data);
        }}
        onCancel={handleRecordingComplete}
      />
      <VideoNotePicker
        ref={videoNotePickerRef}
        onVideoNoteSelected={(data) => {
          handleRecordingComplete();
          onVideoNoteSelected(data);
        }}
        onCancel={handleRecordingComplete}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8
  },
  buttonText: {
    fontSize: 28
  }
});
