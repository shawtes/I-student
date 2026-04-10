const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const StudyContent = require('../models/StudyContent');
const studyService = require('../services/studyService');
const { aiLimiter } = require('../middleware/rateLimiter');

// Generate study content (quiz, flashcards, guide) - with AI rate limiting
router.post('/generate', auth, aiLimiter, async (req, res) => {
  try {
    const { type, title, fileIds, topic } = req.body;

    if (!type || !['quiz', 'flashcard', 'guide'].includes(type)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }

    const content = await studyService.generateContent(
      type,
      title || `${type} on ${topic || 'topic'}`,
      fileIds || [],
      req.user.cognitoId,
      topic
    );

    const studyContent = new StudyContent({
      userId: req.user.cognitoId,
      type,
      title: title || `${type} on ${topic || 'topic'}`,
      content,
      sourceFiles: fileIds || []
    });

    await studyContent.save();

    res.status(201).json(studyContent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's study content
router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query;
    const query = { userId: req.user.cognitoId };

    if (type) {
      query.type = type;
    }

    const content = await StudyContent.find(query).sort({ createdAt: -1 });
    res.json(content);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific study content
router.get('/:id', auth, async (req, res) => {
  try {
    const content = await StudyContent.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    if (content.userId.toString() !== req.user.cognitoId.toString() && !content.isPublic) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(content);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete study content
router.delete('/:id', auth, async (req, res) => {
  try {
    const content = await StudyContent.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    if (content.userId.toString() !== req.user.cognitoId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await StudyContent.findByIdAndDelete(req.params.id);

    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
