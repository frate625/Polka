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
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isVerifyEmail, setIsVerifyEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState(null);

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

  // Обработка регистрации (без подтверждения email)
  const handleRegister = async () => {
    if (!email || !password || !username) {
      if (Platform.OS === 'web') {
        alert('Заполните обязательные поля');
      } else {
        Alert.alert('Ошибка', 'Заполните обязательные поля');
      }
      return;
    }

    if (password.length < 6) {
      if (Platform.OS === 'web') {
        alert('Пароль должен быть не менее 6 символов');
      } else {
        Alert.alert('Ошибка', 'Пароль должен быть не менее 6 символов');
      }
      return;
    }

    setLoading(true);
    const result = await register(username, email, password, phone);
    setLoading(false);

    if (!result.success) {
      if (Platform.OS === 'web') {
        alert(result.error || 'Ошибка регистрации');
      } else {
        Alert.alert('Ошибка регистрации', result.error);
      }
    }
  };

  // Подтверждение email и завершение регистрации
  const handleVerifyEmail = async () => {
    if (!code || code.length !== 6) {
      if (Platform.OS === 'web') {
        alert('Введите 6-значный код');
      } else {
        Alert.alert('Ошибка', 'Введите 6-значный код');
      }
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-email', {
        email: pendingRegistration.email,
        code
      });
      
      if (response.data.success) {
        // Завершаем регистрацию
        const result = await register(
          pendingRegistration.username,
          pendingRegistration.email,
          pendingRegistration.password,
          pendingRegistration.phone
        );
        setLoading(false);
        
        if (!result.success) {
          if (Platform.OS === 'web') {
            alert(result.error || 'Ошибка регистрации');
          } else {
            Alert.alert('Ошибка регистрации', result.error);
          }
        }
      }
    } catch (error) {
      setLoading(false);
      const errorMsg = error.response?.data?.error || 'Неверный код';
      if (Platform.OS === 'web') {
        alert(errorMsg);
      } else {
        Alert.alert('Ошибка', errorMsg);
      }
    }
  };

  // Отправка кода для восстановления пароля
  const handleForgotPassword = async () => {
    if (!email) {
      if (Platform.OS === 'web') {
        alert('Введите email');
      } else {
        Alert.alert('Ошибка', 'Введите email');
      }
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setLoading(false);
      
      if (response.data.success) {
        if (Platform.OS === 'web') {
          alert('Код восстановления отправлен на вашу почту');
        } else {
          Alert.alert('Успешно', 'Код восстановления отправлен на вашу почту');
        }
      }
    } catch (error) {
      setLoading(false);
      const errorMsg = error.response?.data?.error || 'Ошибка отправки кода';
      if (Platform.OS === 'web') {
        alert(errorMsg);
      } else {
        Alert.alert('Ошибка', errorMsg);
      }
    }
  };

  // Сброс пароля с кодом
  const handleResetPassword = async () => {
    if (!code || code.length !== 6) {
      if (Platform.OS === 'web') {
        alert('Введите 6-значный код');
      } else {
        Alert.alert('Ошибка', 'Введите 6-значный код');
      }
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      if (Platform.OS === 'web') {
        alert('Пароль должен быть не менее 6 символов');
      } else {
        Alert.alert('Ошибка', 'Пароль должен быть не менее 6 символов');
      }
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        email,
        code,
        newPassword
      });
      setLoading(false);
      
      if (response.data.success) {
        if (Platform.OS === 'web') {
          alert('Пароль успешно изменен');
        } else {
          Alert.alert('Успешно', 'Пароль успешно изменен');
        }
        setIsForgotPassword(false);
        setCode('');
        setNewPassword('');
        setEmail('');
      }
    } catch (error) {
      setLoading(false);
      const errorMsg = error.response?.data?.error || 'Ошибка сброса пароля';
      if (Platform.OS === 'web') {
        alert(errorMsg);
      } else {
        Alert.alert('Ошибка', errorMsg);
      }
    }
  };

  // Форма подтверждения email
  if (isVerifyEmail) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Polka</Text>
            <Text style={styles.subtitle}>Подтвердите email</Text>
            <Text style={styles.infoText}>
              Введите 6-значный код, отправленный на {pendingRegistration?.email}
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Код подтверждения"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyEmail}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Проверка...' : 'Подтвердить'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setIsVerifyEmail(false);
                setCode('');
                setPendingRegistration(null);
              }}
            >
              <Text style={styles.switchText}>Назад</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Форма восстановления пароля
  if (isForgotPassword) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Polka</Text>
            <Text style={styles.subtitle}>Восстановление пароля</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            {!code && (
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleForgotPassword}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Отправка...' : 'Отправить код'}
                </Text>
              </TouchableOpacity>
            )}

            {code.length > 0 && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Код подтверждения"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Новый пароль"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Сохранение...' : 'Восстановить'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setIsForgotPassword(false);
                setCode('');
                setNewPassword('');
                setEmail('');
              }}
            >
              <Text style={styles.switchText}>Назад к входу</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Основная форма входа/регистрации
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Polka</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Войдите в аккаунт' : 'Создайте аккаунт'}
          </Text>
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
            onPress={isLogin ? handleLogin : handleRegister}
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
              style={styles.forgotButton}
              onPress={() => setIsForgotPassword(true)}
            >
              <Text style={styles.forgotText}>Забыли пароль?</Text>
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
    backgroundColor: '#F8F9FA'
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center'
  },
  header: {
    alignItems: 'center',
    marginBottom: 48
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#5B93FF',
    marginBottom: 8,
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400'
  },
  form: {
    width: '100%'
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  button: {
    backgroundColor: '#5B93FF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#5B93FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
    padding: 8
  },
  switchText: {
    color: '#5B93FF',
    fontSize: 15,
    fontWeight: '500'
  },
  forgotButton: {
    marginTop: 16,
    alignItems: 'center',
    padding: 8
  },
  forgotText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500'
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20
  }
});
