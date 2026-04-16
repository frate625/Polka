const multer = require('multer');
const path = require('path');
const { UPLOADS_DIR, getPublicFileUrl } = require('../config/uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '') || '';
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📤 File saved to disk:', req.file.filename, '→', UPLOADS_DIR);

    const url = getPublicFileUrl(req, req.file.filename);

    res.json({
      message: 'File uploaded successfully',
      file: {
        url,
        public_id: req.file.filename,
        format: path.extname(req.file.filename).replace(/^\./, '') || null,
        size: req.file.size,
        original_name: req.file.originalname
      }
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      error: 'Failed to upload file',
      details: error.message
    });
  }
};

module.exports = {
  upload,
  uploadFile
};
