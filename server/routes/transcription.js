const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const File = require('../models/File');
const TranscriptionSession = require('../models/TranscriptionSession');
const transcriptionService = require('../services/transcriptionService');
const { aiLimiter } = require('../middleware/rateLimiter');
const { aiQuota } = require('../middleware/aiQuota');

// Health — tells the client which pieces are actually usable
router.get('/health', (req, res) => {
  const whisper = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key';
  const gemini = !!process.env.GEMINI_API_KEY;
  const bedrock = !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY;
  res.json({
    liveCapture: true, // browser-side, always on
    whisper, // audio file → text
    summary: gemini || bedrock, // transcript → notes
    providers: { gemini, bedrock, whisper },
  });
});

// Save a live-captured transcript from the browser Web Speech API
router.post('/sessions', auth, async (req, res) => {
  try {
    const { title, folder, transcript, durationSeconds } = req.body;
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ message: 'Transcript is required' });
    }
    const session = await TranscriptionSession.create({
      userId: req.user.cognitoId,
      title: title || 'Untitled lecture',
      folder: folder || 'root',
      transcript,
      durationSeconds
    });
    // Fire-and-forget summary extraction
    transcriptionService.summarize(transcript).then(async (notes) => {
      try {
        await TranscriptionSession.findByIdAndUpdate(session._id, {
          summary: notes.summary,
          keyPoints: notes.keyPoints,
          glossary: notes.glossary,
          actionItems: notes.actionItems,
        });
      } catch (e) { console.error('summary save:', e.message); }
    }).catch(e => console.error('summary gen:', e.message));
    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/sessions', auth, async (req, res) => {
  try {
    const filter = { userId: req.user.cognitoId };
    if (req.query.folder) filter.folder = req.query.folder;
    const sessions = await TranscriptionSession.find(filter)
      .sort({ createdAt: -1 })
      .select('-transcript')
      .limit(100);
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/sessions/:id', auth, async (req, res) => {
  try {
    const session = await TranscriptionSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Not found' });
    if (session.userId !== req.user.cognitoId) return res.status(403).json({ message: 'Not allowed' });
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/sessions/:id', auth, async (req, res) => {
  try {
    const session = await TranscriptionSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Not found' });
    if (session.userId !== req.user.cognitoId) return res.status(403).json({ message: 'Not allowed' });
    await session.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/sessions/:id/summarize', auth, aiQuota, async (req, res) => {
  try {
    const session = await TranscriptionSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Not found' });
    if (session.userId !== req.user.cognitoId) return res.status(403).json({ message: 'Not allowed' });
    const notes = await transcriptionService.summarize(session.transcript);
    session.summary = notes.summary;
    session.keyPoints = notes.keyPoints;
    session.glossary = notes.glossary;
    session.actionItems = notes.actionItems;
    await session.save();
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

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
