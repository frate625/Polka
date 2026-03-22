const User = require('./User');
const Chat = require('./Chat');
const ChatMember = require('./ChatMember');
const Message = require('./Message');
const MessageStatus = require('./MessageStatus');

User.belongsToMany(Chat, { through: ChatMember, foreignKey: 'user_id', as: 'chats' });
Chat.belongsToMany(User, { through: ChatMember, foreignKey: 'chat_id', as: 'members' });

Chat.hasMany(Message, { foreignKey: 'chat_id', as: 'messages' });
Message.belongsTo(Chat, { foreignKey: 'chat_id', as: 'chat' });

User.hasMany(Message, { foreignKey: 'sender_id', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

Message.belongsTo(Message, { foreignKey: 'reply_to_id', as: 'reply_to' });
Message.hasMany(Message, { foreignKey: 'reply_to_id', as: 'replies' });

Message.hasMany(MessageStatus, { foreignKey: 'message_id', as: 'statuses' });
MessageStatus.belongsTo(Message, { foreignKey: 'message_id', as: 'message' });

User.hasMany(MessageStatus, { foreignKey: 'user_id', as: 'messageStatuses' });
MessageStatus.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

ChatMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
ChatMember.belongsTo(Chat, { foreignKey: 'chat_id', as: 'chat' });

module.exports = {
  User,
  Chat,
  ChatMember,
  Message,
  MessageStatus
};
