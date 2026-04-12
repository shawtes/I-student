const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const loadUser = require('../middleware/loadUser');
const Flashcard = require('../models/Flashcard');
const flashcardService = require('../services/flashcardService');
const { aiLimiter } = require('../middleware/rateLimiter');

// List my decks with card counts
router.get('/decks', auth, loadUser, async (req, res) => {
  try {
    const cards = await Flashcard.find({ owner: req.dbUser._id });
    const byDeck = {};
    for (const c of cards) {
      if (!byDeck[c.deck]) byDeck[c.deck] = { deck: c.deck, count: 0, due: 0 };
      byDeck[c.deck].count += 1;
      if (c.dueAt <= new Date()) byDeck[c.deck].due += 1;
    }
    res.json(Object.values(byDeck));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cards in a deck
router.get('/', auth, loadUser, async (req, res) => {
  try {
    const { deck } = req.query;
    const q = { owner: req.dbUser._id };
    if (deck) q.deck = deck;
    const cards = await Flashcard.find(q).sort({ dueAt: 1 });
    res.json(cards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create manually
router.post('/', auth, loadUser, async (req, res) => {
  try {
    const { deck, topic, question, answer } = req.body;
    if (!deck || !question || !answer) {
      return res.status(400).json({ message: 'deck, question and answer are required' });
    }
    const card = await Flashcard.create({
      owner: req.dbUser._id,
      deck,
      topic,
      question,
      answer,
      source: 'manual'
    });
    res.status(201).json(card);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// AI: generate cards from text, files, or both
router.post('/generate', auth, loadUser, aiLimiter, async (req, res) => {
  try {
    const { deck, topic, text, fileIds, count } = req.body;
    if (!deck) {
      return res.status(400).json({ message: 'deck is required' });
    }

    // Build source text from pasted text + extracted file contents
    let sourceText = text || '';
    if (fileIds && fileIds.length > 0) {
      const { extractFromFiles } = require('../services/fileExtractor');
      const fileText = await extractFromFiles(fileIds, req.user.cognitoId);
      if (fileText) sourceText += '\n\n' + fileText;
    }

    if (!sourceText.trim()) {
      return res.status(400).json({ message: 'Provide text or select files to generate from' });
    }

    const cards = await flashcardService.generate({
      text: sourceText,
      topic,
      count: count || 10
    });
    const saved = await Flashcard.insertMany(cards.map(c => ({
      owner: req.dbUser._id,
      deck,
      topic,
      question: c.question,
      answer: c.answer,
      source: 'ai'
    })));
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Delete entire deck (all cards with the given deck name)
router.delete('/decks/:name', auth, loadUser, async (req, res) => {
  try {
    const deckName = decodeURIComponent(req.params.name);
    const result = await Flashcard.deleteMany({
      owner: req.dbUser._id,
      deck: deckName
    });
    res.json({ message: 'Deck deleted', deleted: result.deletedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update
router.put('/:id', auth, loadUser, async (req, res) => {
  try {
    const card = await Flashcard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Not found' });
    if (String(card.owner) !== String(req.dbUser._id)) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    const { question, answer, topic, deck } = req.body;
    if (question !== undefined) card.question = question;
    if (answer !== undefined) card.answer = answer;
    if (topic !== undefined) card.topic = topic;
    if (deck !== undefined) card.deck = deck;
    await card.save();
    res.json(card);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete
router.delete('/:id', auth, loadUser, async (req, res) => {
  try {
    const card = await Flashcard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Not found' });
    if (String(card.owner) !== String(req.dbUser._id)) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    await card.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// SM-2 style review tick
router.post('/:id/review', auth, loadUser, async (req, res) => {
  try {
    const { quality } = req.body; // 0..5
    const card = await Flashcard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Not found' });
    if (String(card.owner) !== String(req.dbUser._id)) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    const q = Math.max(0, Math.min(5, Number(quality) || 0));
    if (q < 3) {
      card.interval = 1;
    } else {
      card.interval = card.interval === 1 ? 6 : Math.round(card.interval * card.ease);
    }
    card.ease = Math.max(1.3, card.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    card.lastReviewedAt = new Date();
    card.dueAt = new Date(Date.now() + card.interval * 24 * 60 * 60 * 1000);
    await card.save();
    res.json(card);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
