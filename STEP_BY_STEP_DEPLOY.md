# 📝 ПОШАГОВАЯ ИНСТРУКЦИЯ ПО ДЕПЛОЮ

## ✅ ШАГ 1: ПОДГОТОВКА КОДА (ГОТОВО!)

Я уже подготовил код:
- ✅ `.gitignore` создан
- ✅ `.env.example` создан
- ✅ `database.js` обновлен для production
- ✅ `api.js` и `socket.js` обновлены для переменных окружения
- ✅ `vercel.json` создан
- ✅ `README.md` создан

---

## 📂 ШАГ 2: ИНИЦИАЛИЗАЦИЯ GIT И GITHUB

### 2.1 Откройте CMD в папке проекта:

```cmd
cd C:\Users\Gamer\chat-app
```

### 2.2 Инициализируйте Git:

```cmd
git init
git add .
git commit -m "Initial commit - Chat App with all features"
```

### 2.3 Создайте GitHub репозиторий:

1. Откройте браузер: **https://github.com/new**
2. **Repository name**: `chat-app` (или любое имя)
3. **Description**: `Telegram-like messenger with calls and media`
4. **Visibility**: 
   - ✅ **Public** (если хотите открытый проект)
   - ⚠️ **Private** (если хотите закрытый)
5. **НЕ** добавляйте README, .gitignore, license (они уже есть!)
6. Нажмите **"Create repository"**

### 2.4 Подключите и загрузите код:

GitHub покажет команды, выполните их в CMD:

```cmd
git remote add origin https://github.com/YOUR-USERNAME/chat-app.git
git branch -M main
git push -u origin main
```

**Замените `YOUR-USERNAME` на ваше имя пользователя GitHub!**

---

## 🚂 ШАГ 3: ДЕПЛОЙ BACKEND НА RAILWAY

### 3.1 Создайте аккаунт Railway:

1. Откройте: **https://railway.app/**
2. Нажмите **"Login"** (справа вверху)
3. Выберите **"Login with GitHub"**
4. Авторизуйте Railway
5. Вы попадете в Dashboard

### 3.2 Создайте новый проект:

1. Нажмите **"New Project"** (большая фиолетовая кнопка)
2. Выберите **"Provision PostgreSQL"**
3. ✅ PostgreSQL база данных создана!

### 3.3 Добавьте Backend:

1. В том же проекте нажмите **"+ New"** (справа вверху)
2. Выберите **"GitHub Repo"**
3. Разрешите доступ к GitHub
4. Выберите репозиторий **"chat-app"**
5. Railway начнет деплой

### 3.4 Настройте Backend Service:

1. Кликните на карточку **"chat-app"** в проекте
2. Перейдите на вкладку **"Settings"**
3. Найдите **"Root Directory"**
4. Укажите: **`backend`**
5. Нажмите **"Save"**

### 3.5 Настройте переменные окружения:

1. Перейдите на вкладку **"Variables"**
2. Нажмите **"+ New Variable"**
3. Добавьте следующие переменные:

**Скопируйте DATABASE_URL:**
- Кликните на карточку **"Postgres"** в вашем проекте
- Вкладка **"Connect"**
- Скопируйте значение **"DATABASE_URL"**

**Добавьте переменные в Backend:**

| Variable Name | Value |
|---------------|-------|
| `DATABASE_URL` | (вставьте скопированный URL) |
| `JWT_SECRET` | `my-super-secret-jwt-key-12345-change-me` |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |

**FRONTEND_URL добавим позже!**

### 3.6 Запустите миграции:

1. Во вкладке **"Settings"** найдите **"Custom Start Command"**
2. Временно измените на: `npm run migrate && npm start`
3. Нажмите **"Save"**
4. Railway автоматически redeploy
5. После успешного деплоя верните обратно: `npm start`

### 3.7 Получите Backend URL:

1. Перейдите на вкладку **"Settings"**
2. Найдите раздел **"Networking"**
3. Нажмите **"Generate Domain"**
4. Вы получите URL типа: `https://chat-app-production-xxxx.up.railway.app`
5. **СКОПИРУЙТЕ ЭТОТ URL!** 📋

---

## ⚡ ШАГ 4: ДЕПЛОЙ FRONTEND НА VERCEL

### 4.1 Обновите API URL в коде:

**В CMD выполните:**
```cmd
echo REACT_APP_API_URL=https://ваш-backend-url.up.railway.app/api >> mobile\.env
echo REACT_APP_BACKEND_URL=https://ваш-backend-url.up.railway.app >> mobile\.env
```

**Замените `ваш-backend-url` на URL из Railway!**

**Или создайте файл вручную `mobile/.env`:**
```env
REACT_APP_API_URL=https://ваш-backend-url.up.railway.app/api
REACT_APP_BACKEND_URL=https://ваш-backend-url.up.railway.app
```

### 4.2 Закоммитьте изменения:

```cmd
cd C:\Users\Gamer\chat-app
git add .
git commit -m "Add production environment config"
git push
```

### 4.3 Создайте аккаунт Vercel:

1. Откройте: **https://vercel.com/**
2. Нажмите **"Sign Up"**
3. Выберите **"Continue with GitHub"**
4. Авторизуйте Vercel

### 4.4 Создайте новый проект:

1. На Dashboard нажмите **"Add New..."**
2. Выберите **"Project"**
3. Найдите репозиторий **"chat-app"**
4. Нажмите **"Import"**

### 4.5 Настройте Build:

**В настройках проекта:**

| Поле | Значение |
|------|----------|
| **Framework Preset** | `Other` |
| **Root Directory** | `mobile` |
| **Build Command** | `npx expo export:web` |
| **Output Directory** | `web-build` |
| **Install Command** | `npm install` |

### 4.6 Добавьте переменные окружения:

В разделе **"Environment Variables"**:

| Name | Value |
|------|-------|
| `REACT_APP_API_URL` | `https://ваш-backend.up.railway.app/api` |
| `REACT_APP_BACKEND_URL` | `https://ваш-backend.up.railway.app` |

**Замените URL на ваш Railway URL!**

### 4.7 Deploy:

1. Нажмите **"Deploy"**
2. Ждите 2-3 минуты
3. ✅ Деплой завершен!
4. Получите URL типа: `https://chat-app-xxxx.vercel.app`

---

## 🔗 ШАГ 5: ОБНОВИТЕ CORS

### 5.1 Вернитесь в Railway:

1. Откройте ваш проект
2. Кликните на **Backend service**
3. Вкладка **"Variables"**
4. Добавьте или обновите:

| Variable Name | Value |
|---------------|-------|
| `FRONTEND_URL` | `https://ваш-frontend.vercel.app` |

**Замените на ваш Vercel URL!**

### 5.2 Redeploy:

Railway автоматически сделает redeploy после изменения переменных.

---

## ✅ ШАГ 6: ПРОВЕРКА!

### 6.1 Откройте ваш мессенджер:

**URL:** `https://ваш-frontend.vercel.app`

### 6.2 Зарегистрируйтесь:

1. Введите логин
2. Введите пароль
3. Нажмите "Зарегистрироваться"

### 6.3 Проверьте функции:

- ✅ Отправка сообщений
- ✅ Создание чатов
- ✅ Загрузка фото (пока на Railway)
- ✅ Голосовые и кружочки
- ✅ Звонки (работают с HTTPS!)

### 6.4 Откройте второе окно инкогнито:

**Ctrl + Shift + N** → `https://ваш-frontend.vercel.app`

Создайте второго пользователя и протестируйте звонки!

---

## 🎉 ГОТОВО!

Ваш мессенджер теперь в интернете:

- 🌍 **Frontend:** `https://ваш-app.vercel.app`
- 🔧 **Backend:** `https://ваш-app.railway.app`
- 🗄️ **Database:** PostgreSQL на Railway

---

## 📞 СЛЕДУЮЩИЕ ШАГИ (ОПЦИОНАЛЬНО):

### Улучшения:

1. **Cloudinary** для файлов (вместо Railway uploads)
2. **Кастомный домен** (your-app.com)
3. **Мониторинг** (Sentry для ошибок)
4. **Аналитика** (Google Analytics)

---

## ❓ ГОТОВЫ НАЧАТЬ?

**Сейчас выполните:**

1. Откройте **CMD**:
```cmd
cd C:\Users\Gamer\chat-app
```

2. Выполните команды из **ШАГ 2** выше:
```cmd
git init
git add .
git commit -m "Initial commit - Chat App"
```

3. **Создайте GitHub репозиторий** (следуйте ШАГ 2.3)

4. **Пришлите мне:**
   - ✅ "Git init готов"
   - ✅ "GitHub репо создан"
   - ✅ URL вашего GitHub репозитория

**И мы продолжим с Railway!** 🚀
