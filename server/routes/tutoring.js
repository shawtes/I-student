const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const loadUser = require('../middleware/loadUser');
const tutoringService = require('../services/tutoringService');
const Conversation = require('../models/Conversation');
const File = require('../models/File');
const { aiLimiter } = require('../middleware/rateLimiter');
const { aiQuota } = require('../middleware/aiQuota');

// ── Legacy single-shot endpoint (backward compat) ──────────────────────

router.post('/ask', auth, aiLimiter, aiQuota, async (req, res) => {
  try {
    const { question, fileIds } = req.body;
    if (!question) return res.status(400).json({ message: 'Question is required' });
    const answer = await tutoringService.answerQuestion(
      question, fileIds || [], req.user.cognitoId
    );
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Conversations ───────────────────────────────────────────────────────

// List conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const filter = { userId: req.user.cognitoId };
    if (req.query.folder) filter.folder = req.query.folder;

    const convos = await Conversation.find(filter)
      .select('title folder updatedAt createdAt messages')
      .sort({ updatedAt: -1 })
      .lean();

    // return slim list with message count instead of full messages
    const list = convos.map(c => ({
      _id: c._id,
      title: c.title,
      folder: c.folder,
      messageCount: c.messages?.length || 0,
      updatedAt: c.updatedAt,
      createdAt: c.createdAt
    }));

    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create conversation
router.post('/conversations', auth, async (req, res) => {
  try {
    const { title, folder, fileIds } = req.body;
    const convo = await Conversation.create({
      userId: req.user.cognitoId,
      title: title || 'New Chat',
      folder: folder || 'root',
      fileIds: fileIds || []
    });
    res.status(201).json(convo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get conversation with full messages
router.get('/conversations/:id', auth, async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.id);
    if (!convo) return res.status(404).json({ message: 'Not found' });
    if (convo.userId !== req.user.cognitoId) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    res.json(convo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update conversation (title, folder, fileIds)
router.put('/conversations/:id', auth, async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.id);
    if (!convo) return res.status(404).json({ message: 'Not found' });
    if (convo.userId !== req.user.cognitoId) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    const { title, folder, fileIds } = req.body;
    if (title !== undefined) convo.title = title;
    if (folder !== undefined) convo.folder = folder;
    if (fileIds !== undefined) convo.fileIds = fileIds;
    await convo.save();
    res.json(convo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete conversation
router.delete('/conversations/:id', auth, async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.id);
    if (!convo) return res.status(404).json({ message: 'Not found' });
    if (convo.userId !== req.user.cognitoId) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    await convo.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message in a conversation
router.post('/conversations/:id/messages', auth, aiLimiter, aiQuota, async (req, res) => {
  try {
    const { content, fileIds } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });

    const convo = await Conversation.findById(req.params.id);
    if (!convo) return res.status(404).json({ message: 'Not found' });
    if (convo.userId !== req.user.cognitoId) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    // Determine which files to use for context
    const refFiles = fileIds && fileIds.length > 0 ? fileIds : convo.fileIds || [];

    // Append user message
    convo.messages.push({ role: 'user', content, fileIds: refFiles });

    // Build history from prior messages
    const history = convo.messages.slice(0, -1).map(m => ({
      role: m.role,
      content: m.content
    }));

    // Get AI response with conversation context
    const answer = await tutoringService.chat(
      content, refFiles, req.user.cognitoId, history
    );

    // Append assistant message
    convo.messages.push({ role: 'assistant', content: answer });
    await convo.save();

    // Auto-title after first exchange (fire and forget)
    if (convo.messages.length === 2 && convo.title === 'New Chat') {
      tutoringService.generateTitle(content, answer).then(title => {
        if (title) {
          Conversation.findByIdAndUpdate(convo._id, { title }).catch(() => {});
        }
      });
    }

    const assistantMsg = convo.messages[convo.messages.length - 1];
    res.json({ message: assistantMsg, conversationTitle: convo.title });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get folders used across files and conversations
router.get('/folders', auth, async (req, res) => {
  try {
    const [fileFolders, convoFolders] = await Promise.all([
      File.distinct('folder', { userId: req.user.cognitoId }),
      Conversation.distinct('folder', { userId: req.user.cognitoId })
    ]);
    const all = [...new Set([...fileFolders, ...convoFolders])].filter(Boolean).sort();
    res.json(all);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Stub for backward compat
router.get('/history', auth, async (req, res) => {
  res.json([]);
});

module.exports = router;
