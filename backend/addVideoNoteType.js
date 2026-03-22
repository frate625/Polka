// Скрипт для добавления типа video_note в enum_messages_type
const { sequelize } = require('./src/config/database');

async function addVideoNoteType() {
  try {
    console.log('Подключение к базе данных...');
    await sequelize.authenticate();
    console.log('✅ Подключено');

    // Проверяем есть ли уже video_note
    const [enumResults] = await sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'enum_messages_type'
      )
    `);
    
    const hasVideoNote = enumResults.some(r => r.enumlabel === 'video_note');
    
    if (!hasVideoNote) {
      console.log('Добавление значения video_note в ENUM...');
      await sequelize.query(`
        ALTER TYPE enum_messages_type ADD VALUE 'video_note'
      `);
      console.log('✅ Значение video_note добавлено');
    } else {
      console.log('✅ Значение video_note уже существует');
    }

    console.log('\n✅ Миграция завершена успешно!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    process.exit(1);
  }
}

addVideoNoteType();
