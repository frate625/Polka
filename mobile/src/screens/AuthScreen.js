// Экран аутентификации (вход и регистрация)
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useAuth } from '../store/AuthContext';
import api from '../services/api';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('');

  // Проверка подключения к Backend при загрузке
  React.useEffect(() => {
    // Показываем какой API URL используется
    const apiBaseUrl = api.defaults.baseURL;
    console.log('API Base URL:', apiBaseUrl);
    setApiStatus('API: ' + apiBaseUrl);
  }, []);

  const checkBackendConnection = async () => {
    try {
      const backendUrl = api.defaults.baseURL.replace('/api', '');
      console.log('Проверка подключения к:', backendUrl);
      const response = await fetch(backendUrl, { method: 'GET' });
      const data = await response.json();
      console.log('Ответ Backend:', data);
      if (data.message) {
        setApiStatus('✅ Подключено: ' + backendUrl);
      }
    } catch (error) {
      const backendUrl = api.defaults.baseURL.replace('/api', '');
      setApiStatus('❌ Не удается подключиться: ' + backendUrl);
      console.error('Backend connection error:', error);
    }
  };

  // Обработка входа
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Ошибка входа', result.error || 'Неверный email или пароль');
    }
  };

  // Обработка регистрации
  const handleRegister = async () => {
    if (!email || !password || !username) {
      Alert.alert('Ошибка', 'Заполните обязательные поля');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Ошибка', 'Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);
    const result = await register(username, email, password, phone);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Ошибка регистрации', result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Polka</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Войдите в аккаунт' : 'Создайте аккаунт'}
          </Text>
          {apiStatus && (
            <Text style={[styles.apiStatus, apiStatus.includes('❌') && styles.apiStatusError]}>
              {apiStatus}
            </Text>
          )}
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Имя пользователя"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Телефон (необязательно)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Пароль"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={() => {
              alert('Кнопка нажата! Email: ' + email);
              if (isLogin) {
                handleLogin();
              } else {
                handleRegister();
              }
            }}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchText}>
              {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
            </Text>
          </TouchableOpacity>

          {isLogin && (
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => {
                setEmail('alice_new@example.com');
                setPassword('password123');
              }}
            >
              <Text style={styles.testButtonText}>
                🧪 Заполнить тестовыми данными
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20
  },
  header: {
    alignItems: 'center',
    marginBottom: 40
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#666'
  },
  apiStatus: {
    fontSize: 13,
    color: '#34C759',
    marginTop: 12,
    fontWeight: '500'
  },
  apiStatusError: {
    color: '#FF3B30'
  },
  form: {
    width: '100%'
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10
  },
  buttonDisabled: {
    backgroundColor: '#ccc'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center'
  },
  switchText: {
    color: '#007AFF',
    fontSize: 14
  },
  testButton: {
    marginTop: 15,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center'
  },
  testButtonText: {
    color: '#666',
    fontSize: 13
  }
});
