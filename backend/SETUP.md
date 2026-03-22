# 🚀 Инструкция по запуску Backend

## ✅ Вы уже сделали:
- [x] Настроили PostgreSQL
- [x] Создали базу данных `chat_app`
- [x] Все файлы backend созданы

## 📋 Следующие шаги:

### Шаг 1: Настройка .env файла ✅ (УЖЕ СДЕЛАНО!)

Файл `.env` уже создан. **ПРОВЕРЬТЕ И ИЗМЕНИТЕ:**

```bash
DB_PASSWORD=ваш_пароль_от_postgresql
```

Замените `ваш_пароль_от_postgresql` на реальный пароль от PostgreSQL!

---

### Шаг 2: Установка зависимостей

Откройте терминал в папке `backend` и выполните:

```bash
cd C:\Users\Gamer\chat-app\backend
npm install
```

**Время установки:** 1-3 минуты

**Что установится:**
- Express - веб-сервер
- Socket.io - WebSocket для real-time чата
- Sequelize + pg - ORM для PostgreSQL
- bcryptjs - хеширование паролей
- jsonwebtoken - JWT аутентификация
- и другие...

---

### Шаг 3: Инициализация базы данных

После установки зависимостей, создайте таблицы в БД:

```bash
npm run init-db
```

**Что произойдет:**
- Подключится к PostgreSQL
- Создаст 5 таблиц:
  * `users` - пользователи
  * `chats` - чаты
  * `chat_members` - участники чатов
  * `messages` - сообщения
  * `message_statuses` - статусы прочтения

**Ожидаемый вывод:**
```
🔄 Подключаюсь к базе данных...
✅ Подключение к PostgreSQL успешно!
🔄 Создаю таблицы...
✅ Все таблицы созданы успешно!
✅ База данных готова к работе!
```

---

### Шаг 4: Запуск сервера

Запустите backend сервер:

```bash
npm run dev
```

**Ожидаемый вывод:**
```
🚀 Server running on http://localhost:3000
📊 Database connected
🔌 Socket.io ready
```

Сервер будет работать на http://localhost:3000

---

## 🧪 Проверка работы API

После запуска сервера, проверьте что API работает:

### Способ 1: Браузер

Откройте в браузере: http://localhost:3000

Должны увидеть: `{"message":"Chat App API is running"}`

### Способ 2: PowerShell/CMD

```powershell
curl http://localhost:3000
```

### Способ 3: Postman / Insomnia

Создайте GET запрос на `http://localhost:3000`

---

## 📝 Доступные API endpoints:

После запуска будут доступны:

**Аутентификация:**
- POST `/api/auth/register` - регистрация
- POST `/api/auth/login` - вход
- POST `/api/auth/logout` - выход

**Пользователи:**
- GET `/api/users/me` - текущий пользователь
- PUT `/api/users/me` - обновить профиль
- GET `/api/users/search` - поиск пользователей

**Чаты:**
- GET `/api/chats` - список чатов
- POST `/api/chats` - создать чат
- GET `/api/chats/:id` - получить чат
- PUT `/api/chats/:id` - обновить чат
- DELETE `/api/chats/:id` - удалить чат

**Сообщения:**
- GET `/api/chats/:id/messages` - получить сообщения
- POST `/api/chats/:id/messages` - отправить сообщение

**Загрузка файлов:**
- POST `/api/upload` - загрузить файл

---

## ⚠️ Возможные проблемы:

### Проблема 1: "Cannot find module 'dotenv'"

**Решение:** Установите зависимости
```bash
npm install
```

### Проблема 2: "Connection refused" или "ECONNREFUSED"

**Причина:** PostgreSQL не запущен

**Решение:** Запустите PostgreSQL через службы Windows:
1. Win + R → `services.msc`
2. Найдите `postgresql-x64-XX`
3. Запустите службу

### Проблема 3: "password authentication failed"

**Причина:** Неправильный пароль в .env

**Решение:** Проверьте пароль в файле `.env` (строка `DB_PASSWORD`)

### Проблема 4: "database 'chat_app' does not exist"

**Причина:** База данных не создана

**Решение:** Создайте базу через pgAdmin или psql:
```sql
CREATE DATABASE chat_app;
```

### Проблема 5: "Port 3000 is already in use"

**Причина:** Порт занят другим приложением

**Решение:** Измените порт в `.env`:
```
PORT=3001
```

---

## 🔍 Логи и отладка

Сервер работает в режиме development, поэтому будут видны все SQL запросы и логи.

Если что-то не работает:
1. Смотрите на вывод в консоли
2. Проверьте файл `.env`
3. Убедитесь что PostgreSQL запущен
4. Проверьте что база `chat_app` создана

---

## ✅ Чек-лист готовности Backend:

- [ ] `.env` файл настроен (пароль изменен)
- [ ] `npm install` выполнен успешно
- [ ] `npm run init-db` создал таблицы
- [ ] `npm run dev` запустил сервер
- [ ] http://localhost:3000 отвечает
- [ ] Нет ошибок в консоли

Когда все галочки проставлены → **Backend готов!** ✅

---

## 📱 Следующий шаг: Mobile App

После того как backend запустится, можно переходить к настройке мобильного приложения!
