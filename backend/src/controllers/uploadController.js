const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');

// Используем память для временного хранения (не диск)
const storage = multer.memoryStorage();

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

    console.log('📤 Uploading file to Cloudinary:', req.file.originalname);

    // Определяем resource_type по расширению
    const ext = path.extname(req.file.originalname).toLowerCase();
    let resourceType = 'auto';
    if (['.mp4', '.webm', '.avi', '.mov'].includes(ext)) {
      resourceType = 'video';
    } else if (['.mp3', '.wav', '.ogg', '.webm'].includes(ext)) {
      resourceType = 'video'; // Cloudinary хранит аудио как video
    }

    // Загружаем в Cloudinary из буфера
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: 'polka-uploads',
          public_id: `${Date.now()}-${Math.round(Math.random() * 1E9)}`
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Cloudinary upload success:', result.secure_url);
            resolve(result);
          }
        }
      );
      
      uploadStream.end(req.file.buffer);
    });

    res.json({
      message: 'File uploaded successfully',
      file: {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        format: uploadResult.format,
        size: uploadResult.bytes,
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
