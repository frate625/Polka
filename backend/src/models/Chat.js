const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Chat = sequelize.define('Chat', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('private', 'group'),
    allowNull: false,
    defaultValue: 'private'
  },
  avatar_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  owner_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  last_message_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'chats',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Chat;
