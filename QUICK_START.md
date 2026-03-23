# ⚡ БЫСТРЫЙ СТАРТ

## 🎯 Для локальной разработки (5 минут)

### 1. Запустить PostgreSQL
```
Откройте pgAdmin4 → подключитесь к серверу
Или через services.msc → найдите postgresql → Start
```

### 2. Создать базу данных (только первый раз)
```
В pgAdmin4:
Правый клик на Databases → Create → Database
Name: chat_app
Save
```

### 3. Установить зависимости (только первый раз)
```bash
# Backend
cd C:\Users\Gamer\chat-app\backend
npm install
node src/config/initDatabase.js

# Frontend
cd C:\Users\Gamer\chat-app\mobile
npm install
```

### 4. Запустить всё
```
Двойной клик на: START_LOCAL.bat
```

**Или вручную:**

**Терминал 1 - Backend:**
```bash
cd C:\Users\Gamer\chat-app\backend
npm start
```

**Терминал 2 - Frontend:**
```bash
cd C:\Users\Gamer\chat-app\mobile
npx expo start --web
```

### 5. Открыть приложение
```
http://localhost:19006
```

---

## 🌐 Для production (Railway + Vercel)

### Проверить Railway
```
1. Откройте: https://railway.app/
2. Войдите в аккаунт
3. Найдите проект "polka"
4. Проверьте URL: https://polka-production.up.railway.app
```

### Проверить Vercel
```
1. Откройте: https://vercel.com/
2. Войдите в аккаунт
3. Найдите проект "polka"
4. Проверьте URL: https://polka-pi.vercel.app
```

---

## 🔍 Проверка статуса

Двойной клик на: `CHECK_STATUS.bat`

---

## 📋 Полная инструкция

Смотрите: `ПЛАН_ВОССТАНОВЛЕНИЯ.md`

---

## 🚨 Если что-то не работает

### Backend не запускается:
```
1. Проверьте PostgreSQL запущен
2. Проверьте пароль в backend\.env
3. Проверьте база данных chat_app создана
```

### Frontend не подключается:
```
1. Проверьте Backend запущен (http://localhost:3000)
2. Проверьте mobile\.env имеет правильный URL
3. Очистите кэш: npx expo start --web --clear
```

### PostgreSQL не работает:
```
1. Откройте services.msc (Win+R)
2. Найдите postgresql-x64-XX
3. Правый клик → Start
```

---

## 🎉 Готово!

После запуска:
- Backend API: http://localhost:3000
- Frontend App: http://localhost:19006
- pgAdmin4: http://localhost:5050 (если настроен)

**Приятного использования!** 🚀
