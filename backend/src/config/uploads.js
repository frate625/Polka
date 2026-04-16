const path = require('path');
const fs = require('fs');

/**
 * Каталог для загруженных файлов.
 * Локально: backend/uploads
 * Railway: смонтируйте volume (например на /data) и задайте UPLOADS_DIR=/data/uploads
 */
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '..', '..', 'uploads');

function ensureUploadsDir() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Публичный URL файла для ответа API и поля file_url в БД.
 * В production задайте PUBLIC_BASE_URL=https://ваш-сервис.up.railway.app
 * (иначе за прокси иногда неверный host/protocol).
 */
function getPublicFileUrl(req, filename) {
  const safeName = encodeURIComponent(filename);
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/$/, '');
  if (base) {
    return `${base}/uploads/${safeName}`;
  }
  const host = req.get('host') || 'localhost';
  let proto = req.protocol;
  if (process.env.NODE_ENV === 'production' && req.get('x-forwarded-proto') === 'https') {
    proto = 'https';
  }
  return `${proto}://${host}/uploads/${safeName}`;
}

module.exports = {
  UPLOADS_DIR,
  ensureUploadsDir,
  getPublicFileUrl
};
