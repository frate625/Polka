require('dotenv').config();
const { sequelize } = require('./src/config/database');
const { User, Chat, ChatMember, Message } = require('./src/models');

async function viewAllData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    // 1. USERS
    console.log('═'.repeat(60));
    console.log('👥 USERS');
    console.log('═'.repeat(60));
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'is_online', 'created_at'],
      order: [['created_at', 'DESC']]
    });
    console.table(users.map(u => ({
      ID: u.id.substring(0, 8) + '...',
      Username: u.username,
      Email: u.email,
      Online: u.is_online ? '🟢' : '⚫',
      Created: u.created_at.toISOString().split('T')[0]
    })));

    // 2. CHATS
    console.log('\n' + '═'.repeat(60));
    console.log('💬 CHATS');
    console.log('═'.repeat(60));
    const chats = await Chat.findAll({
      include: [{
        model: User,
        as: 'members',
        attributes: ['username'],
        through: { attributes: ['role'] }
      }],
      order: [['created_at', 'DESC']]
    });
    
    chats.forEach(chat => {
      const members = chat.members.map(m => 
        `${m.username} (${m.ChatMember.role})`
      ).join(', ');
      console.log(`\n📁 Chat ID: ${chat.id.substring(0, 8)}...`);
      console.log(`   Type: ${chat.type}`);
      console.log(`   Members: ${members}`);
      console.log(`   Created: ${chat.created_at.toISOString()}`);
    });

    // 3. MESSAGES
    console.log('\n' + '═'.repeat(60));
    console.log('✉️  MESSAGES');
    console.log('═'.repeat(60));
    const messages = await Message.findAll({
      include: [{
        model: User,
        as: 'sender',
        attributes: ['username']
      }],
      order: [['created_at', 'DESC']],
      limit: 20
    });

    messages.forEach(msg => {
      console.log(`\n[${msg.created_at.toISOString()}]`);
      console.log(`From: ${msg.sender.username}`);
      console.log(`Chat: ${msg.chat_id.substring(0, 8)}...`);
      console.log(`Message: ${msg.content}`);
      console.log(`Status: ${msg.status}`);
    });

    // 4. STATISTICS
    console.log('\n' + '═'.repeat(60));
    console.log('📊 STATISTICS');
    console.log('═'.repeat(60));
    const stats = {
      'Total Users': await User.count(),
      'Online Users': await User.count({ where: { is_online: true } }),
      'Total Chats': await Chat.count(),
      'Private Chats': await Chat.count({ where: { type: 'private' } }),
      'Group Chats': await Chat.count({ where: { type: 'group' } }),
      'Total Messages': await Message.count(),
      'Text Messages': await Message.count({ where: { type: 'text' } }),
      'File Messages': await Message.count({ where: { type: 'file' } })
    };
    console.table(stats);

    console.log('\n✅ Data view complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

viewAllData();
