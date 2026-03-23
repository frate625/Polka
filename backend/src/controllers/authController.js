const { User } = require('../models');
const { generateToken } = require('../utils/jwt');
const nodemailer = require('nodemailer');

// In-memory хранилище для кодов (в production лучше использовать Redis)
const verificationCodes = new Map();
const passwordResetCodes = new Map();

// Функция генерации 6-значного кода
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Настройка email транспорта (поддержка Gmail и Yandex)
const getEmailTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  
  // Определяем провайдера по домену
  if (emailUser && emailUser.includes('@yandex')) {
    return nodemailer.createTransport({
      host: 'smtp.yandex.ru',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else if (emailUser && emailUser.includes('@gmail')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  
  return null;
};

const transporter = getEmailTransporter();

// Функция отправки email
const sendEmail = async (to, subject, text) => {
  try {
    // Если нет настроек email, просто логируем код в консоль
    if (!process.env.EMAIL_USER || !transporter) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 EMAIL (dev mode):');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Code: ${text.match(/\d{6}/)?.[0] || text}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { success: true };
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text
    });
    console.log(`✅ Email отправлен: ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Email send error:', error);
    // В dev режиме все равно продолжаем и логируем код
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 EMAIL (fallback):');
    console.log(`To: ${to}`);
    console.log(`Code: ${text.match(/\d{6}/)?.[0] || text}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return { success: true };
  }
};

const register = async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;

    const existingUser = await User.findOne({
      where: {
        email
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = await User.create({
      username,
      email,
      phone,
      password_hash: password
    });

    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatar_url: user.avatar_url,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await user.update({ is_online: true, last_seen: new Date() });

    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatar_url: user.avatar_url,
        status: user.status,
        is_online: user.is_online
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

const logout = async (req, res) => {
  try {
    await req.user.update({ is_online: false, last_seen: new Date() });
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Отправка кода подтверждения email при регистрации
const sendVerificationCode = async (req, res) => {
  try {
    const { email, username } = req.body;

    if (!email || !username) {
      return res.status(400).json({ error: 'Email и имя обязательны' });
    }

    // Проверка что email еще не зарегистрирован
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email уже зарегистрирован' });
    }

    // Генерация кода
    const code = generateCode();
    
    // Сохранение кода (действителен 10 минут)
    verificationCodes.set(email, {
      code,
      timestamp: Date.now(),
      data: req.body
    });

    // Очистка кода через 10 минут
    setTimeout(() => {
      verificationCodes.delete(email);
    }, 10 * 60 * 1000);

    // Отправка email
    await sendEmail(
      email,
      'Polka - Подтверждение email',
      `Ваш код подтверждения: ${code}\n\nКод действителен 10 минут.`
    );

    res.json({ success: true, message: 'Код отправлен на email' });
  } catch (error) {
    console.error('Send verification code error:', error);
    res.status(500).json({ error: 'Ошибка отправки кода' });
  }
};

// Подтверждение email и завершение регистрации
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email и код обязательны' });
    }

    const storedData = verificationCodes.get(email);

    if (!storedData) {
      return res.status(400).json({ error: 'Код истек или не найден' });
    }

    if (storedData.code !== code) {
      return res.status(400).json({ error: 'Неверный код' });
    }

    // Проверка времени (10 минут)
    if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
      verificationCodes.delete(email);
      return res.status(400).json({ error: 'Код истек' });
    }

    // Удаляем код после успешной проверки
    verificationCodes.delete(email);

    res.json({ success: true, message: 'Email подтвержден' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Ошибка подтверждения email' });
  }
};

// Отправка кода восстановления пароля
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email обязателен' });
    }

    // Проверка что пользователь существует
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Генерация кода
    const code = generateCode();
    
    // Сохранение кода (действителен 10 минут)
    passwordResetCodes.set(email, {
      code,
      timestamp: Date.now()
    });

    // Очистка кода через 10 минут
    setTimeout(() => {
      passwordResetCodes.delete(email);
    }, 10 * 60 * 1000);

    // Отправка email
    await sendEmail(
      email,
      'Polka - Восстановление пароля',
      `Ваш код для восстановления пароля: ${code}\n\nКод действителен 10 минут.\n\nЕсли вы не запрашивали восстановление пароля, проигнорируйте это письмо.`
    );

    res.json({ success: true, message: 'Код отправлен на email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Ошибка отправки кода' });
  }
};

// Сброс пароля с кодом
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
    }

    const storedData = passwordResetCodes.get(email);

    if (!storedData) {
      return res.status(400).json({ error: 'Код истек или не найден' });
    }

    if (storedData.code !== code) {
      return res.status(400).json({ error: 'Неверный код' });
    }

    // Проверка времени (10 минут)
    if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
      passwordResetCodes.delete(email);
      return res.status(400).json({ error: 'Код истек' });
    }

    // Находим пользователя и обновляем пароль
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Обновляем пароль
    user.password_hash = newPassword; // Модель автоматически захеширует
    await user.save();

    // Удаляем код после успешного сброса
    passwordResetCodes.delete(email);

    res.json({ success: true, message: 'Пароль успешно изменен' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Ошибка сброса пароля' });
  }
};

module.exports = {
  register,
  login,
  logout,
  sendVerificationCode,
  verifyEmail,
  forgotPassword,
  resetPassword
};
