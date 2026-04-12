const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const File = require('../models/File');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { uploadToS3, deleteFromS3, getPresignedUrl } = require('../config/s3');

// Configure multer to use memory storage (buffer) for S3 uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/mp4',
      'audio/x-m4a',
      'video/mp4'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and audio/video files are allowed.'));
  }
});

// Upload file to S3
router.post('/upload', auth, uploadLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = req.file.originalname.split('.').pop();
    const s3Key = `uploads/${req.user.cognitoId}/${uniqueSuffix}.${ext}`;

    const storageUrl = await uploadToS3(req.file.buffer, s3Key, req.file.mimetype);

    const file = new File({
      userId: req.user.cognitoId,
      filename: `${uniqueSuffix}.${ext}`,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      storageUrl,
      s3Key,
      folder: req.body.folder || 'root',
      tags: req.body.tags ? JSON.parse(req.body.tags) : []
    });

    await file.save();

    res.status(201).json(file);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Upload failed. Check S3 configuration.' });
  }
});

// Get distinct folders for this user's files
router.get('/folders', auth, async (req, res) => {
  try {
    const folders = await File.distinct('folder', { userId: req.user.cognitoId });
    res.json(folders.filter(Boolean).sort());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user files
router.get('/', auth, async (req, res) => {
  try {
    const { folder, search } = req.query;
    const query = { userId: req.user.cognitoId };

    if (folder) {
      query.folder = folder;
    }

    if (search) {
      query.originalName = { $regex: search, $options: 'i' };
    }

    const files = await File.find(query).sort({ uploadedAt: -1 });
    res.json(files);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get presigned download URL for a file
router.get('/:id/download', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.userId.toString() !== req.user.cognitoId.toString() && !file.isPublic) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const url = await getPresignedUrl(file.s3Key);
    res.json({ url, filename: file.originalName });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get file by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.userId.toString() !== req.user.cognitoId.toString() && !file.isPublic) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(file);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete file (from S3 and DB)
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.userId.toString() !== req.user.cognitoId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete from S3
    if (file.s3Key) {
      await deleteFromS3(file.s3Key);
    }

    await File.findByIdAndDelete(req.params.id);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update file metadata
router.put('/:id', auth, async (req, res) => {
  try {
    const { tags, folder, isPublic } = req.body;

    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.userId.toString() !== req.user.cognitoId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    file.tags = tags || file.tags;
    file.folder = folder || file.folder;
    file.isPublic = isPublic !== undefined ? isPublic : file.isPublic;

    await file.save();

    res.json(file);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
