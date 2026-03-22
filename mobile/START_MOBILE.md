# 🚀 ЗАПУСК МОБИЛЬНОГО ПРИЛОЖЕНИЯ

## ✅ ЧТО УЖЕ ГОТОВО:
- ✅ Backend сервер запущен на `http://10.0.1.9:3000`
- ✅ Mobile приложение настроено на ваш IP: `10.0.1.9`
- ✅ Все файлы конфигурации обновлены

---

## 📋 ШАГ 1: Установка зависимостей

Откройте **НОВОЕ окно PowerShell** и выполните:

```powershell
cd C:\Users\Gamer\chat-app\mobile
npm install
```

Это займет 2-5 минут.

---

## 📋 ШАГ 2: Установка Expo CLI (если еще не установлен)

```powershell
npm install -g expo-cli
```

---

## 📋 ШАГ 3: Запуск приложения

```powershell
npm start
```

Или запустите конкретную платформу:

```powershell
# Android эмулятор
npm run android

# iOS симулятор (только Mac)
npm run ios

# Веб-браузер
npm run web
```

---

## 📱 ТЕСТИРОВАНИЕ НА РЕАЛЬНОМ УСТРОЙСТВЕ

### 1. Установите Expo Go на телефон:
- **Android**: https://play.google.com/store/apps/details?id=host.exp.exponent
- **iOS**: https://apps.apple.com/app/expo-go/id982107779

### 2. Убедитесь:
- ✅ Телефон и компьютер в одной WiFi сети
- ✅ Backend сервер запущен (`npm run dev` в папке backend)
- ✅ Firewall не блокирует порт 3000

### 3. Запустите:
```powershell
npm start
```

### 4. Отсканируйте QR код:
- **Android**: Откройте Expo Go → Scan QR code
- **iOS**: Откройте камеру iPhone → наведите на QR код

---

## 🔥 ВОЗМОЖНЫЕ ПРОБЛЕМЫ

### Проблема 1: "Cannot connect to Metro"
**Решение:**
- Убедитесь что компьютер и телефон в одной WiFi
- Проверьте Firewall настройки
- Используйте опцию "Tunnel" в Expo (медленнее, но работает всегда)

### Проблема 2: "Network request failed"
**Решение:**
- Проверьте что Backend запущен
- Проверьте IP адрес в файлах:
  - `src/services/api.js` → `API_URL`
  - `src/services/socket.js` → `SOCKET_URL`
- Попробуйте открыть `http://10.0.1.9:3000` в браузере телефона

### Проблема 3: Expo CLI не найден
**Решение:**
```powershell
npm install -g expo-cli
```

---

## 🎯 ПЕРВЫЙ ЗАПУСК

После запуска приложения вы увидите:

1. **Экран Входа/Регистрации**
2. Создайте нового пользователя или войдите как:
   - Email: `alice_new@example.com`
   - Password: `password123`
3. Вы попадете в список чатов
4. Создайте новый чат или откройте существующий

---

## 📊 АРХИТЕКТУРА ПОДКЛЮЧЕНИЯ

```
[Ваш телефон] 
    ↓ WiFi (10.0.1.X)
    ↓
[Роутер]
    ↓
[Ваш компьютер] (10.0.1.9)
    ↓
[Backend Server] (localhost:3000)
    ↓
[PostgreSQL] (localhost:5432)
```

---

## ✅ ПРОВЕРКА ГОТОВНОСТИ

Перед запуском убедитесь:

- [ ] Backend сервер запущен (зеленый текст "Server running")
- [ ] PostgreSQL запущен
- [ ] Телефон и компьютер в одной WiFi сети
- [ ] Firewall не блокирует порты 3000, 8081, 19000-19001

---

## 🚀 КОМАНДЫ

```powershell
# Установка зависимостей
npm install

# Запуск с выбором платформы
npm start

# Запуск на Android
npm run android

# Запуск в браузере
npm run web

# Очистка кэша (при проблемах)
expo start -c
```

---

**Удачи! 🎉**
