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
const { UPLOADS_DIR, ensureUploadsDir } = require('./src/config/uploads');

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);
const staticOrigins = [
  'http://localhost:19006',
  'http://localhost:8081',
  'https://polka-pi.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean).map((o) => String(o).replace(/\/$/, ''));

/** Разрешённые Origin для API и Socket.io (в т.ч. preview-деплои Vercel *.vercel.app) */
function isOriginAllowed(origin) {
  if (!origin) return true;
  const o = origin.replace(/\/$/, '');
  if (staticOrigins.includes(o)) return true;
  if (/^https:\/\/[a-z0-9.-]+\.vercel\.app$/i.test(o)) return true;
  return false;
}

const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      const ok = isOriginAllowed(origin);
      if (!ok && origin) console.warn('Socket.io CORS: origin not allowed:', origin);
      callback(null, ok);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: (origin, callback) => callback(null, isOriginAllowed(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статическая раздача загруженных файлов (тот же каталог, что и multer — в т.ч. Railway volume)
ensureUploadsDir();
const uploadsPath = UPLOADS_DIR;
console.log('📂 Uploads folder path:', uploadsPath);

// Статика uploads: корректный MIME + CORS (видео с домена Vercel грузит другой origin)
const uploadsStatic = express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (filePath.endsWith('.webm')) {
      res.setHeader('Content-Type', 'video/webm');
    } else if (filePath.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
    } else if (filePath.endsWith('.ogg') || filePath.endsWith('.oga')) {
      res.setHeader('Content-Type', 'audio/ogg');
    }
  }
});

app.use('/uploads', (req, res, next) => {
  console.log('📥 File request:', req.path);
  next();
}, uploadsStatic);

app.get('/', (req, res) => {
  res.json({ message: 'Polka Messenger API Server', version: '1.0.0' });
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
