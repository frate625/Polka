/**
 * Скрипт инициализации базы данных
 * Создает все таблицы согласно моделям
 */

require('dotenv').config();
const { sequelize } = require('./database');
const models = require('../models');

async function initDatabase() {
  try {
    console.log('🔄 Подключаюсь к базе данных...');
    
    // Проверяем подключение
    await sequelize.authenticate();
    console.log('✅ Подключение к PostgreSQL успешно!');
    
    console.log('\n🔄 Создаю таблицы...');
    
    // Создаем таблицы (force: false - не удаляет существующие данные)
    // Если нужно пересоздать таблицы, используйте force: true
    await sequelize.sync({ force: false, alter: true });
    
    console.log('✅ Все таблицы созданы успешно!');
    
    console.log('\n📊 Созданные таблицы:');
    console.log('  - users (пользователи)');
    console.log('  - chats (чаты)');
    console.log('  - chat_members (участники чатов)');
    console.log('  - messages (сообщения)');
    console.log('  - message_statuses (статусы прочтения)');
    
    console.log('\n✅ База данных готова к работе!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при инициализации БД:', error);
    console.error('\n💡 Проверьте:');
    console.error('  1. PostgreSQL запущен');
    console.error('  2. База данных "chat_app" создана');
    console.error('  3. Пароль в .env файле правильный');
    console.error('  4. Параметры подключения в .env корректны');
    process.exit(1);
  }
}

// Запускаем инициализацию
initDatabase();
