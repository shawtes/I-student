const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const loadUser = require('../middleware/loadUser');
const GmailToken = require('../models/GmailToken');
const Booking = require('../models/Booking');

// Check link status
router.get('/status', auth, loadUser, async (req, res) => {
  try {
    const tok = await GmailToken.findOne({ user: req.dbUser._id });
    res.json({ linked: !!tok, expiresAt: tok?.expiresAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save a token (the OAuth callback would normally POST here after exchange)
router.post('/link', auth, loadUser, async (req, res) => {
  try {
    const { accessToken, refreshToken, scope, tokenType, expiresAt } = req.body;
    if (!accessToken) return res.status(400).json({ message: 'accessToken required' });
    const doc = await GmailToken.findOneAndUpdate(
      { user: req.dbUser._id },
      { accessToken, refreshToken, scope, tokenType, expiresAt },
      { upsert: true, new: true }
    );
    res.json({ linked: true, id: doc._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/link', auth, loadUser, async (req, res) => {
  try {
    await GmailToken.deleteOne({ user: req.dbUser._id });
    res.json({ linked: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List upcoming events (uses internal calendar from bookings if Gmail not linked)
router.get('/events', auth, loadUser, async (req, res) => {
  try {
    const now = new Date();
    const filter = {
      $or: [{ student: req.dbUser._id }, { tutor: req.dbUser._id }],
      startTime: { $gte: now },
      status: { $in: ['confirmed', 'accepted'] }
    };
    const bookings = await Booking.find(filter)
      .populate('student', 'name email')
      .populate('tutor', 'name email')
      .sort({ startTime: 1 });

    const tok = await GmailToken.findOne({ user: req.dbUser._id });
    res.json({
      source: tok ? 'gmail' : 'internal',
      events: bookings.map(b => ({
        id: b._id,
        title: `${b.subject || 'Tutoring session'} with ${b.tutor?.name || b.student?.name}`,
        start: b.startTime,
        durationMinutes: b.durationMinutes
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
