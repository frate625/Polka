const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: false  // Отключаем автоматическое переподключение
  }
});

redisClient.on('error', (err) => {
  // Просто логируем, но не падаем
  // console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis client connected');
});

module.exports = redisClient;
