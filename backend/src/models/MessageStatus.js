const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MessageStatus = sequelize.define('MessageStatus', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  message_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'messages',
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
  status: {
    type: DataTypes.ENUM('delivered', 'read'),
    allowNull: false,
    defaultValue: 'delivered'
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'message_status',
  timestamps: false
});

module.exports = MessageStatus;
