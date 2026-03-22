# 🚀 Деплой мессенджера в Production

## 📋 ЧТО НУЖНО РАЗВЕРНУТЬ:

1. **Backend** (Node.js + Express + Socket.io)
2. **Frontend** (React Native Web)
3. **PostgreSQL** база данных
4. **Файловое хранилище** (для загрузок)

---

## 🎯 РЕКОМЕНДУЕМЫЙ ВАРИАНТ: Railway + Vercel

**Почему:**
- ✅ **Бесплатно** (с лимитами)
- ✅ **Просто** развернуть
- ✅ **Автоматический деплой** из Git
- ✅ **PostgreSQL** включен
- ✅ **HTTPS** автоматически (нужно для WebRTC)

---

## 📁 ШАГ 1: ПОДГОТОВКА КОДА

### 1.1 Создайте `.gitignore` в корне проекта:

```
# В C:\Users\Gamer\chat-app\.gitignore

# Node modules
node_modules/
backend/node_modules/
mobile/node_modules/

# Environment variables
.env
.env.local
.env.production

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# Build
build/
dist/
.expo/
web-build/

# Uploads (для локальной разработки)
backend/uploads/*
!backend/uploads/.gitkeep
```

### 1.2 Создайте переменные окружения для backend:

**`backend/.env.example`**
```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Server
PORT=3000
NODE_ENV=production

# JWT
JWT_SECRET=your-super-secret-key-change-this

# CORS
FRONTEND_URL=https://your-frontend-url.vercel.app

# Redis (опционально)
REDIS_URL=redis://localhost:6379
```

### 1.3 Обновите `backend/server.js` для production:

Создам обновленный файл:
```javascript
// В начале файла добавьте:
require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');

const app = express();

// CORS для production
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:19006',
  credentials: true
};

app.use(cors(corsOptions));

// ... остальной код
```

### 1.4 Создайте `backend/package.json` scripts:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "migrate": "node addReplyColumn.js && node addVideoNoteType.js"
}
```

---

## 🚂 ШАГ 2: ДЕПЛОЙ BACKEND на Railway

### 2.1 Создайте аккаунт:

1. Перейдите на **https://railway.app/**
2. Нажмите **"Start a New Project"**
3. Войдите через **GitHub**

### 2.2 Создайте новый проект:

1. **"New Project"** → **"Deploy from GitHub repo"**
2. Подключите свой GitHub аккаунт
3. Выберите репозиторий с мессенджером (или создайте новый)

### 2.3 Настройте PostgreSQL:

1. В проекте нажмите **"+ New"**
2. Выберите **"Database"** → **"PostgreSQL"**
3. Railway автоматически создаст базу
4. Скопируйте `DATABASE_URL` из вкладки **"Connect"**

### 2.4 Настройте Backend Service:

1. **"+ New"** → **"GitHub Repo"**
2. Выберите ваш репозиторий
3. В **Settings** → **Root Directory**: `/backend`
4. В **Variables** добавьте:
   ```
   DATABASE_URL = (скопируйте из PostgreSQL)
   JWT_SECRET = your-random-secret-key-12345
   NODE_ENV = production
   FRONTEND_URL = https://your-app.vercel.app (добавим позже)
   ```

5. **Deploy** → Railway автоматически развернет!

### 2.5 Получите URL backend:

1. Перейдите в **Settings** → **Networking**
2. **Generate Domain** → Получите URL типа: `https://your-app.up.railway.app`
3. **Сохраните этот URL!**

---

## ⚡ ШАГ 3: ДЕПЛОЙ FRONTEND на Vercel

### 3.1 Подготовьте frontend:

**Обновите `mobile/src/services/api.js`:**

```javascript
const getApiUrl = () => {
  if (Platform.OS === 'web') {
    // Production URL
    if (process.env.NODE_ENV === 'production') {
      return 'https://your-app.up.railway.app/api';
    }
    // Development URL
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'http://localhost:3000/api';
    } else {
      return 'http://10.0.1.9:3000/api';
    }
  } else {
    return 'http://10.0.1.9:3000/api';
  }
};
```

**Обновите `mobile/src/services/socket.js` аналогично:**

```javascript
const getSocketUrl = () => {
  if (Platform.OS === 'web') {
    if (process.env.NODE_ENV === 'production') {
      return 'https://your-app.up.railway.app';
    }
    // ... остальной код
  }
};
```

### 3.2 Создайте Vercel аккаунт:

1. Перейдите на **https://vercel.com/**
2. **Sign Up** → войдите через **GitHub**

### 3.3 Создайте новый проект:

1. **"Add New..."** → **"Project"**
2. **Import** ваш GitHub репозиторий
3. **Framework Preset**: выберите **"Other"** или **"Create React App"**
4. **Root Directory**: `/mobile`
5. **Build Command**: 
   ```
   npx expo export:web
   ```
6. **Output Directory**: 
   ```
   web-build
   ```
7. **Environment Variables** добавьте:
   ```
   NODE_ENV = production
   EXPO_PUBLIC_API_URL = https://your-app.up.railway.app
   ```

8. Нажмите **"Deploy"**

### 3.4 Получите URL frontend:

После деплоя вы получите URL типа: `https://your-app.vercel.app`

### 3.5 Обновите CORS на backend:

Вернитесь в **Railway** → Backend → **Variables**:
```
FRONTEND_URL = https://your-app.vercel.app
```

**Redeploy** backend!

---

## 🗂️ ШАГ 4: ФАЙЛОВОЕ ХРАНИЛИЩЕ

### Вариант 1: Cloudinary (Рекомендуется)

**Преимущества:**
- ✅ Бесплатный tier (25GB)
- ✅ CDN
- ✅ Автоматическая оптимизация

**Установка:**
```bash
cd backend
npm install cloudinary multer-storage-cloudinary
```

**Настройка:**
```javascript
// backend/config/cloudinary.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;
```

**Обновите upload route в `backend/src/routes/upload.js`**

### Вариант 2: AWS S3 / DigitalOcean Spaces

Для больших проектов используйте S3.

---

## ✅ ШАГ 5: ФИНАЛЬНАЯ ПРОВЕРКА

### 5.1 Проверьте что работает:

1. Откройте **https://your-app.vercel.app**
2. Зарегистрируйтесь
3. Создайте чат
4. Отправьте сообщение
5. Попробуйте загрузить фото
6. Попробуйте звонок (WebRTC требует HTTPS ✅)

### 5.2 Проверьте логи:

**Railway (Backend):**
- **Deployments** → **View Logs**

**Vercel (Frontend):**
- **Deployments** → выберите деплой → **View Function Logs**

---

## 🔧 АЛЬТЕРНАТИВНЫЕ ВАРИАНТЫ:

### Вариант 2: Render.com (Всё в одном)

**Плюсы:**
- Бесплатный tier
- PostgreSQL включен
- Простой деплой

**Минусы:**
- Медленнее чем Railway
- Засыпает после 15 мин неактивности

### Вариант 3: DigitalOcean (VPS)

**Для продвинутых:**
- $6/месяц
- Полный контроль
- Нужно настраивать nginx, SSL, PM2

---

## 💰 СТОИМОСТЬ:

### Бесплатный вариант (Railway + Vercel):
- **Railway**: $5 кредитов/месяц бесплатно
- **Vercel**: 100GB bandwidth бесплатно
- **PostgreSQL**: включен

**Хватит на:**
- ~100 пользователей онлайн
- ~1000 сообщений/день

### Платный вариант:
- **Railway Pro**: $5/месяц + usage
- **Vercel Pro**: $20/месяц
- **Cloudinary Pro**: $89/месяц (если много медиа)

---

## 🚨 ВАЖНЫЕ МОМЕНТЫ:

### 1. Environment Variables

**НИКОГДА** не коммитьте:
- `.env` файлы
- Пароли
- API ключи
- JWT секреты

### 2. HTTPS

WebRTC звонки **ТРЕБУЮТ HTTPS**! Railway и Vercel дают его автоматически.

### 3. CORS

Обязательно настройте правильные CORS origins на backend.

### 4. Database Migrations

Перед первым запуском выполните:
```bash
# В Railway Shell
npm run migrate
```

### 5. File Uploads

Используйте Cloudinary или S3, **НЕ** локальную папку uploads!

---

## 📊 ПЛАН ДЕПЛОЯ (КРАТКИЙ):

```
1. Создать GitHub репозиторий
2. Push код на GitHub
3. Railway:
   - Создать проект
   - Добавить PostgreSQL
   - Добавить backend service
   - Настроить переменные
   - Deploy
4. Vercel:
   - Импортировать проект
   - Настроить build
   - Добавить переменные
   - Deploy
5. Обновить FRONTEND_URL на Railway
6. Настроить Cloudinary
7. Тестировать!
```

---

**Готовы начать? С чего начнем?** 🚀

1. Создадим GitHub репозиторий?
2. Сразу на Railway?
3. Сначала подготовим код?
