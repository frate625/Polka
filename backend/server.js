require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { sequelize } = require('./src/config/database');
const redisClient = require('./src/config/redis');

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');

const chatSocket = require('./src/socket/chatSocket');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статическая раздача загруженных файлов
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.json({ message: 'Chat App API Server' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

chatSocket(io);

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    await sequelize.sync({ alter: false });
    console.log('Database models synchronized.');
    
    // Redis - опциональное подключение
    try {
      await redisClient.connect();
      console.log('✅ Redis connection established successfully.');
    } catch (redisError) {
      console.log('⚠️  Redis not available - continuing without caching');
      console.log('   (This is OK for development, but recommended for production)');
    }
    
    server.listen(PORT, () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Database: Connected`);
      console.log(`🔌 Socket.io: Ready`);
      console.log(`${'='.repeat(60)}\n`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await redisClient.quit();
  await sequelize.close();
  server.close(() => {
    console.log('HTTP server closed');
  });
});
