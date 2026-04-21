const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const auth = require('../middleware/auth');
const loadUser = require('../middleware/loadUser');
const GmailToken = require('../models/GmailToken');
const Booking = require('../models/Booking');
const User = require('../models/User');
const gcal = require('../services/googleCalendarService');

// In-memory pending state → userId map for OAuth (short-lived)
const pendingStates = new Map();
const STATE_TTL_MS = 10 * 60 * 1000;

function putState(userId, returnTo) {
  const state = crypto.randomBytes(16).toString('hex');
  pendingStates.set(state, { userId: String(userId), returnTo, ts: Date.now() });
  return state;
}

function takeState(state) {
  const entry = pendingStates.get(state);
  if (!entry) return null;
  pendingStates.delete(state);
  if (Date.now() - entry.ts > STATE_TTL_MS) return null;
  return entry;
}

// Is Google OAuth configured on the server at all?
router.get('/config', (req, res) => {
  res.json({ configured: gcal.isConfigured() });
});

// Status for the current user
router.get('/status', auth, loadUser, async (req, res) => {
  try {
    const tok = await GmailToken.findOne({ user: req.dbUser._id });
    res.json({
      configured: gcal.isConfigured(),
      linked: !!tok,
      expiresAt: tok?.expiresAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Step 1: get the Google consent URL
router.get('/auth-url', auth, loadUser, (req, res) => {
  if (!gcal.isConfigured()) {
    return res.status(501).json({ message: 'Google OAuth is not configured on the server' });
  }
  const returnTo = req.query.returnTo
    || (req.dbUser.role === 'tutor' ? '/tutor/profile' : '/student/bookings');
  const state = putState(req.dbUser._id, returnTo);
  const url = gcal.authUrl(state);
  res.json({ url });
});

// Step 2: OAuth callback from Google
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    if (error) return res.redirect(redirectBack({ ok: false, reason: error }));
    if (!code || !state) return res.redirect(redirectBack({ ok: false, reason: 'missing_code' }));

    const entry = takeState(String(state));
    if (!entry) return res.redirect(redirectBack({ ok: false, reason: 'bad_state' }));

    const tokens = await gcal.exchangeCode(String(code));

    await GmailToken.findOneAndUpdate(
      { user: entry.userId },
      {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        scope: tokens.scope,
        tokenType: tokens.token_type,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
      { upsert: true, new: true }
    );

    res.redirect(redirectBack({ ok: true, returnTo: entry.returnTo }));
  } catch (err) {
    console.error('OAuth callback:', err);
    res.redirect(redirectBack({ ok: false, reason: 'exchange_failed' }));
  }
});

function redirectBack({ ok, reason, returnTo }) {
  const base = process.env.FRONTEND_URL || 'http://localhost:3000';
  const path = returnTo || '/tutor/profile';
  const params = new URLSearchParams({ calendar: ok ? 'linked' : 'error' });
  if (reason) params.set('reason', reason);
  return `${base}${path}?${params.toString()}`;
}

// Legacy manual link (leave for testing); real users go through /auth-url + /callback
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

// Upcoming events — merge internal bookings with the user's Google Calendar when linked
router.get('/events', auth, loadUser, async (req, res) => {
  try {
    const now = new Date();

    // Internal bookings as events
    const bookings = await Booking.find({
      $or: [{ student: req.dbUser._id }, { tutor: req.dbUser._id }],
      startTime: { $gte: now },
      status: { $in: ['confirmed', 'accepted'] },
    })
      .populate('student', 'name email')
      .populate('tutor', 'name email')
      .sort({ startTime: 1 });

    const internal = bookings.map(b => ({
      id: String(b._id),
      source: 'internal',
      title: `${b.subject || 'Tutoring session'} with ${b.tutor?.name || b.student?.name}`,
      start: b.startTime,
      durationMinutes: b.durationMinutes,
      meetUrl: b.meetingUrl || null,
    }));

    // Google events when linked
    let googleEvents = null;
    try {
      const raw = await gcal.listUpcomingEvents(req.dbUser._id);
      if (raw) {
        googleEvents = raw.map(e => ({
          id: e.id,
          source: 'google',
          title: e.summary || '(untitled)',
          start: e.start?.dateTime || e.start?.date,
          end: e.end?.dateTime || e.end?.date,
          meetUrl: e.hangoutLink || null,
          htmlLink: e.htmlLink || null,
        }));
      }
    } catch (e) {
      console.error('google events list:', e.message);
    }

    res.json({
      source: googleEvents ? 'merged' : 'internal',
      events: googleEvents ? [...internal, ...googleEvents] : internal,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
