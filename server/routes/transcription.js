const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const File = require('../models/File');
const transcriptionService = require('../services/transcriptionService');
const { aiLimiter } = require('../middleware/rateLimiter');

// Transcribe audio file - with AI rate limiting
router.post('/:fileId', auth, aiLimiter, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.userId.toString() !== req.user.cognitoId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if file is audio
    if (!file.fileType.startsWith('audio/') && !file.fileType.includes('video/')) {
      return res.status(400).json({ message: 'File must be audio or video' });
    }

    // Check if already transcribed
    if (file.transcription.status === 'completed') {
      return res.json({ message: 'File already transcribed', transcription: file.transcription.text });
    }

    // Update status to pending
    file.transcription.status = 'pending';
    await file.save();

    // Transcribe (async)
    transcriptionService.transcribe(file._id, file.localPath)
      .then(async (transcriptionText) => {
        const updatedFile = await File.findById(file._id);
        if (updatedFile) {
          updatedFile.transcription.text = transcriptionText;
          updatedFile.transcription.status = 'completed';
          await updatedFile.save();
        }
      })
      .catch(async (error) => {
        console.error('Transcription error:', error);
        const updatedFile = await File.findById(file._id);
        if (updatedFile) {
          updatedFile.transcription.status = 'failed';
          await updatedFile.save();
        }
      });

    res.json({ message: 'Transcription started', fileId: file._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get transcription status
router.get('/:fileId/status', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.userId.toString() !== req.user.cognitoId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      status: file.transcription.status,
      text: file.transcription.text
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
