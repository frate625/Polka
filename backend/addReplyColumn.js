// Скрипт для добавления колонки reply_to_id в таблицу messages
const { sequelize } = require('./src/config/database');

async function addReplyColumn() {
  try {
    console.log('Подключение к базе данных...');
    await sequelize.authenticate();
    console.log('✅ Подключено');

    console.log('Добавление колонки reply_to_id...');
    
    // Проверяем существует ли колонка
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='messages' 
      AND column_name='reply_to_id'
    `);

    if (results.length > 0) {
      console.log('✅ Колонка reply_to_id уже существует');
    } else {
      // Добавляем колонку
      await sequelize.query(`
        ALTER TABLE messages 
        ADD COLUMN reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL
      `);
      console.log('✅ Колонка reply_to_id успешно добавлена');
    }

    // Проверяем тип для voice
    console.log('Проверка типа voice в ENUM...');
    const [enumResults] = await sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'enum_messages_type'
      )
    `);
    
    const hasVoice = enumResults.some(r => r.enumlabel === 'voice');
    
    if (!hasVoice) {
      console.log('Добавление значения voice в ENUM...');
      await sequelize.query(`
        ALTER TYPE enum_messages_type ADD VALUE 'voice'
      `);
      console.log('✅ Значение voice добавлено');
    } else {
      console.log('✅ Значение voice уже существует');
    }

    console.log('\n✅ Миграция завершена успешно!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    process.exit(1);
  }
}

addReplyColumn();
