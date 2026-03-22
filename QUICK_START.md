# Быстрый старт Chat App

Пошаговая инструкция для запуска приложения на вашем компьютере.

## Шаг 1: Установка зависимостей

### 1.1 Установите PostgreSQL
- Скачайте с [postgresql.org](https://www.postgresql.org/download/)
- Запомните пароль для пользователя postgres

### 1.2 Установите Redis
- **Windows**: Скачайте с [github.com/microsoftarchive/redis](https://github.com/microsoftarchive/redis/releases)
- **Mac**: `brew install redis`
- **Linux**: `sudo apt-get install redis-server`

### 1.3 Создайте аккаунт Cloudinary (бесплатно)
1. Зарегистрируйтесь на [cloudinary.com](https://cloudinary.com/)
2. Сохраните Cloud Name, API Key и API Secret

## Шаг 2: Настройка Backend

```bash
cd backend
npm install
```

Создайте файл `.env` (скопируйте из `.env.example`):
```bash
copy .env.example .env
```

Отредактируйте файл `.env` и укажите ваши данные:
```env
PORT=3000
NODE_ENV=development

# Данные вашей PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chat_app
DB_USER=postgres
DB_PASSWORD=ваш_пароль_postgres

# Придумайте секретный ключ
JWT_SECRET=ваш_секретный_ключ_любая_случайная_строка

# Redis (оставьте по умолчанию)
REDIS_URL=redis://localhost:6379

# Данные из Cloudinary
CLOUDINARY_CLOUD_NAME=ваш_cloud_name
CLOUDINARY_API_KEY=ваш_api_key
CLOUDINARY_API_SECRET=ваш_api_secret

FRONTEND_URL=http://localhost:19006
```

Создайте базу данных PostgreSQL:
```sql
-- Откройте pgAdmin или командную строку PostgreSQL
CREATE DATABASE chat_app;
```

Запустите сервер:
```bash
npm run dev
```

Вы должны увидеть:
```
Database connection established successfully.
Database models synchronized.
Redis connection established successfully.
Server running on port 3000
```

## Шаг 3: Настройка Mobile

Откройте новое окно терминала:

```bash
cd mobile
npm install
```

Отредактируйте файл `mobile/src/services/api.js`:
```javascript
// Измените эту строку:
const API_URL = 'http://localhost:3000/api';

// На IP вашего компьютера если тестируете на устройстве:
const API_URL = 'http://192.168.1.100:3000/api';
```

Отредактируйте файл `mobile/src/services/socket.js`:
```javascript
// Измените эту строку:
const SOCKET_URL = 'http://localhost:3000';

// На IP вашего компьютера если тестируете на устройстве:
const SOCKET_URL = 'http://192.168.1.100:3000';
```

**Как узнать IP компьютера:**
- Windows: `ipconfig` в командной строке
- Mac/Linux: `ifconfig` в терминале
- Ищите IPv4 адрес (обычно 192.168.x.x)

Запустите приложение:
```bash
npm start
```

## Шаг 4: Тестирование

### Вариант 1: На эмуляторе/симуляторе
- Нажмите `a` для Android
- Нажмите `i` для iOS (только на Mac)
- Нажмите `w` для веб-версии

### Вариант 2: На реальном устройстве
1. Установите **Expo Go** на телефон
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Отсканируйте QR-код из терминала

## Шаг 5: Первое использование

1. Зарегистрируйте пользователя
2. Создайте второго пользователя (на другом устройстве или в эмуляторе)
3. Найдите пользователя через поиск
4. Создайте чат и отправьте сообщение!

## Типичные проблемы

### Backend не запускается

**Проблема:** Ошибка подключения к PostgreSQL
- Проверьте, что PostgreSQL запущен
- Проверьте пароль в `.env`
- Проверьте, что база данных создана

**Проблема:** Ошибка подключения к Redis
- Запустите Redis:
  - Windows: запустите `redis-server.exe`
  - Mac: `brew services start redis`
  - Linux: `sudo service redis-server start`

### Mobile не подключается к серверу

**Проблема:** Cannot connect to server
- Убедитесь, что backend запущен
- Проверьте IP адрес в api.js и socket.js
- Убедитесь, что телефон и компьютер в одной сети Wi-Fi
- Отключите файрвол на компьютере временно

### Не работает загрузка файлов

**Проблема:** Upload failed
- Проверьте Cloudinary credentials в `.env`
- Убедитесь, что аккаунт активирован

## Что дальше?

После успешного запуска вы можете:

1. **Изменить дизайн** - отредактируйте стили в компонентах
2. **Добавить функции** - см. список в README.md
3. **Развернуть в продакшн** - инструкции в README.md

## Нужна помощь?

- Проверьте логи в консоли backend
- Проверьте логи в Expo DevTools (нажмите `m`)
- Убедитесь, что все зависимости установлены

Удачи! 🚀
