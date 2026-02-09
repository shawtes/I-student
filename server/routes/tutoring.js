const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const tutoringService = require('../services/tutoringService');

// Ask a question (RAG-based tutoring)
router.post('/ask', auth, async (req, res) => {
  try {
    const { question, fileIds } = req.body;

    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const answer = await tutoringService.answerQuestion(
      question,
      fileIds || [],
      req.user._id
    );

    res.json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get conversation history
router.get('/history', auth, async (req, res) => {
  try {
    // This would be implemented with a conversation history model
    // For now, return empty array
    res.json([]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
