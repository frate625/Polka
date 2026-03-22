# Polka Mobile - Мобильное приложение

Кроссплатформенное мобильное приложение для iOS и Android, построенное на React Native с использованием Expo.

## Возможности

- Аутентификация пользователей (регистрация и вход)
- Список чатов в реальном времени
- Приватные и групповые чаты
- Отправка текстовых сообщений
- Отправка изображений, видео и файлов
- Индикатор "печатает..."
- Статусы сообщений (отправлено, доставлено, прочитано)
- Онлайн-статус пользователей
- Редактирование профиля
- Поиск пользователей

## Технологии

- React Native 0.72
- Expo ~49.0
- React Navigation 6
- Socket.io-client
- Axios
- AsyncStorage

## Установка

1. Установите зависимости:
```bash
cd mobile
npm install
```

2. Настройте URL сервера в файлах:
- `src/services/api.js` - измените `API_URL`
- `src/services/socket.js` - измените `SOCKET_URL`

3. Запустите приложение:
```bash
# Запуск с выбором платформы
npm start

# Запуск на Android
npm run android

# Запуск на iOS (только на Mac)
npm run ios

# Запуск в веб-браузере
npm run web
```

## Структура проекта

```
mobile/
├── src/
│   ├── screens/              # Экраны приложения
│   │   ├── AuthScreen.js     # Экран входа/регистрации
│   │   ├── ChatsListScreen.js # Список чатов
│   │   ├── ChatScreen.js      # Экран чата с сообщениями
│   │   ├── ProfileScreen.js   # Профиль пользователя
│   │   ├── CreateChatScreen.js # Создание чата
│   │   └── CreateGroupScreen.js # Создание группы
│   ├── components/           # Переиспользуемые компоненты
│   │   ├── ChatItem.js       # Элемент чата в списке
│   │   ├── MessageItem.js    # Элемент сообщения
│   │   └── MediaPicker.js    # Выбор медиа-файлов
│   ├── services/             # API и сокеты
│   │   ├── api.js           # REST API клиент
│   │   └── socket.js         # Socket.io клиент
│   ├── store/                # Управление состоянием
│   │   ├── AuthContext.js    # Контекст аутентификации
│   │   └── SocketContext.js  # Контекст WebSocket
│   └── navigation/           # Навигация
│       └── MainNavigator.js  # Главный навигатор
├── App.js                    # Точка входа
├── app.json                  # Конфигурация Expo
└── package.json             # Зависимости
```

## Основные компоненты

### AuthContext
Управляет аутентификацией пользователя, сохраняет токен и данные в AsyncStorage.

### SocketContext
Управляет WebSocket соединением, автоматически подключается/отключается при входе/выходе.

### Экраны

- **AuthScreen** - Регистрация и вход в систему
- **ChatsListScreen** - Список всех чатов пользователя
- **ChatScreen** - Экран чата с сообщениями и отправкой
- **ProfileScreen** - Просмотр и редактирование профиля
- **CreateChatScreen** - Поиск пользователей и создание чата
- **CreateGroupScreen** - Создание группового чата

## Требования

- Node.js 16+
- npm или yarn
- Expo CLI
- Для iOS: macOS с Xcode
- Для Android: Android Studio

## Тестирование

Для тестирования на реальном устройстве:

1. Установите приложение Expo Go на телефон
2. Запустите `npm start`
3. Отсканируйте QR-код в Expo Go

## Сборка для продакшена

### Android
```bash
expo build:android
```

### iOS
```bash
expo build:ios
```

## Настройка для продакшена

Перед публикацией измените:

1. URLs API и WebSocket на продакшн-серверы
2. Иконки и splash screen в `app.json`
3. Bundle identifier в `app.json`
4. Версию приложения

## Лицензия

ISC
