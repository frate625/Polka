# Chat App Backend

Backend server for the MVP chat application built with Node.js, Express, Socket.io, and PostgreSQL.

## Features

- User authentication with JWT
- Real-time messaging with Socket.io
- Private and group chats
- File uploads (images, videos, files)
- Online status tracking
- Message read receipts
- Typing indicators

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- Redis (v6 or higher)
- Cloudinary account (for file uploads)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration:
- Database credentials
- JWT secret
- Redis URL
- Cloudinary credentials

4. Create the PostgreSQL database:
```sql
CREATE DATABASE chat_app;
```

5. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will automatically create database tables on startup.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update profile
- `GET /api/users/search?query=` - Search users
- `GET /api/users/:id` - Get user by ID

### Chats
- `GET /api/chats` - Get user's chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:id` - Get chat details
- `PUT /api/chats/:id` - Update chat
- `DELETE /api/chats/:id` - Leave chat
- `POST /api/chats/:id/members` - Add member
- `DELETE /api/chats/:id/members/:userId` - Remove member

### Messages
- `GET /api/messages/chats/:id/messages` - Get chat messages
- `POST /api/messages/chats/:id/messages` - Send message
- `PUT /api/messages/:id/read` - Mark as read

### Upload
- `POST /api/upload` - Upload file

## Socket.io Events

### Client to Server
- `join_chat` - Join a chat room
- `leave_chat` - Leave a chat room
- `send_message` - Send a message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `message_read` - Mark message as read

### Server to Client
- `new_message` - New message received
- `message_delivered` - Message delivered
- `message_read` - Message read by recipient
- `user_typing` - User is typing
- `user_stopped_typing` - User stopped typing
- `user_online` - User came online
- `user_offline` - User went offline

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── socket/          # Socket.io handlers
│   └── utils/           # Utility functions
├── .env.example         # Environment variables template
├── package.json         # Dependencies
└── server.js           # Entry point
```

## Environment Variables

See `.env.example` for all required environment variables.

## License

ISC
