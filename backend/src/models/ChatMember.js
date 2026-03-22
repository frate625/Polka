const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatMember = sequelize.define('ChatMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  chat_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'chats',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'member'),
    allowNull: false,
    defaultValue: 'member'
  },
  unread_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'chat_members',
  timestamps: true,
  createdAt: 'joined_at',
  updatedAt: 'updated_at'
});

module.exports = ChatMember;
