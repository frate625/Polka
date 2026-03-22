// Компонент для выбора и отправки медиа-файлов
import React, { useState, useRef } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Alert, Platform, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { uploadAPI } from '../services/api';

export default function MediaPicker({ onMediaSelected }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Запрос разрешений на доступ к камере и галерее
  const requestPermissions = async () => {
    if (Platform.OS === 'web') return true;
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Необходимо разрешение на доступ к галерее');
      return false;
    }
    return true;
  };

  // Открытие галереи для выбора изображения
  const pickImage = async () => {
    setShowMenu(false);
    
    if (Platform.OS === 'web') {
      // Для веб используем стандартный file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          await uploadWebFile(file, 'image');
        }
      };
      input.click();
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: false
      });

      if (!result.canceled && result.assets[0]) {
        await uploadFile(result.assets[0], 'image');
      }
    } catch (error) {
      console.error('Ошибка выбора изображения:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать изображение');
    }
  };

  // Открытие камеры для съемки фото
  const takePhoto = async () => {
    setShowMenu(false);
    
    if (Platform.OS === 'web') {
      Alert.alert('Недоступно', 'Камера не поддерживается в веб-версии');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Необходимо разрешение на доступ к камере');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8
      });

      if (!result.canceled && result.assets[0]) {
        await uploadFile(result.assets[0], 'image');
      }
    } catch (error) {
      console.error('Ошибка съемки фото:', error);
      Alert.alert('Ошибка', 'Не удалось сделать фото');
    }
  };

  // Выбор документа/файла
  const pickDocument = async () => {
    setShowMenu(false);
    
    if (Platform.OS === 'web') {
      // Для веб используем стандартный file input
      const input = document.createElement('input');
      input.type = 'file';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          await uploadWebFile(file, 'file');
        }
      };
      input.click();
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (result.type === 'success') {
        await uploadFile(result, 'file');
      }
    } catch (error) {
      console.error('Ошибка выбора файла:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать файл');
    }
  };

  // Запись голосового сообщения (только для веб)
  const startRecording = async () => {
    setShowMenu(false);
    
    if (Platform.OS !== 'web') {
      Alert.alert('Недоступно', 'Голосовые сообщения пока доступны только в веб-версии');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
        await uploadWebFile(audioFile, 'voice');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Ошибка записи голоса:', error);
      Alert.alert('Ошибка', 'Не удалось начать запись. Разрешите доступ к микрофону.');
    }
  };

  // Остановка записи
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Загрузка веб-файла
  const uploadWebFile = async (file, type) => {
    try {
      const response = await uploadAPI.uploadWebFile(file);
      
      if (response.data.file) {
        onMediaSelected({
          url: response.data.file.url,
          name: response.data.file.original_name || file.name,
          size: response.data.file.size || file.size,
          type
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить файл. Проверьте консоль для деталей.');
      console.error('Детали ошибки:', error.response?.data || error.message);
    }
  };

  // Загрузка файла на сервер (мобильная версия)
  const uploadFile = async (file, type) => {
    try {
      const response = await uploadAPI.uploadFile(file);
      
      if (response.data.file) {
        onMediaSelected({
          url: response.data.file.url,
          name: response.data.file.original_name || file.name,
          size: response.data.file.size,
          type
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить файл');
    }
  };

  if (isRecording) {
    return (
      <TouchableOpacity style={[styles.button, styles.recordingButton]} onPress={stopRecording}>
        <Text style={styles.recordingText}>⏸️ Стоп</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View>
      <TouchableOpacity style={styles.button} onPress={() => setShowMenu(true)}>
        <Text style={styles.buttonText}>📎</Text>
      </TouchableOpacity>

      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={pickImage}>
              <Text style={styles.menuIcon}>🖼️</Text>
              <Text style={styles.menuText}>Фото</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={pickDocument}>
              <Text style={styles.menuIcon}>📄</Text>
              <Text style={styles.menuText}>Файл</Text>
            </TouchableOpacity>

            {Platform.OS === 'web' && (
              <TouchableOpacity style={styles.menuItem} onPress={startRecording}>
                <Text style={styles.menuIcon}>🎤</Text>
                <Text style={styles.menuText}>Голосовое</Text>
              </TouchableOpacity>
            )}

            {Platform.OS !== 'web' && (
              <TouchableOpacity style={styles.menuItem} onPress={takePhoto}>
                <Text style={styles.menuIcon}>📷</Text>
                <Text style={styles.menuText}>Камера</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.menuItem, styles.cancelItem]} onPress={() => setShowMenu(false)}>
              <Text style={styles.menuText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonText: {
    fontSize: 24
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 20,
    paddingHorizontal: 12
  },
  recordingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
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
    padding: 20,
    paddingBottom: 40
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  menuIcon: {
    fontSize: 28,
    marginRight: 16
  },
  menuText: {
    fontSize: 17,
    color: '#000'
  },
  cancelItem: {
    borderBottomWidth: 0,
    justifyContent: 'center',
    marginTop: 8
  }
});
