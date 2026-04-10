const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const loadUser = require('../middleware/loadUser');
const ForumPost = require('../models/ForumPost');

// List posts (optional subject filter)
router.get('/', auth, async (req, res) => {
  try {
    const q = {};
    if (req.query.subject) q.subject = req.query.subject;
    const posts = await ForumPost.find(q)
      .populate('author', 'name email')
      .populate('replies.author', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a post
router.post('/', auth, loadUser, async (req, res) => {
  try {
    const { title, body, subject } = req.body;
    if (!title || !body) return res.status(400).json({ message: 'Title and body required' });
    const post = await ForumPost.create({
      author: req.dbUser._id,
      title,
      body,
      subject
    });
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reply to a post
router.post('/:id/replies', auth, loadUser, async (req, res) => {
  try {
    const { body } = req.body;
    if (!body) return res.status(400).json({ message: 'Body required' });
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Not found' });
    post.replies.push({ author: req.dbUser._id, body });
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete (author or admin)
router.delete('/:id', auth, loadUser, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Not found' });
    if (String(post.author) !== String(req.dbUser._id) && req.dbUser.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }
    await post.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
