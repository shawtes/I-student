const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const StudySession = require('../models/StudySession');
const Booking = require('../models/Booking');

// Create study session
router.post('/sessions', auth, async (req, res) => {
  try {
    const { title, description, folder, startTime, endTime, color, type } = req.body;
    if (!title || !startTime || !endTime) {
      return res.status(400).json({ message: 'Title, start and end times are required' });
    }
    const session = await StudySession.create({
      userId: req.user.cognitoId,
      title, description,
      folder: folder || 'root',
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      color, type
    });
    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all events (study sessions + tutoring bookings merged)
router.get('/sessions', auth, async (req, res) => {
  try {
    const { start, end } = req.query;
    const filter = { userId: req.user.cognitoId };
    if (start && end) {
      filter.startTime = { $gte: new Date(start), $lte: new Date(end) };
    }

    const sessions = await StudySession.find(filter).sort({ startTime: 1 });

    // Also pull confirmed tutoring bookings as calendar events
    let bookings = [];
    try {
      const User = require('../models/User');
      const dbUser = await User.findOne({ cognitoId: req.user.cognitoId });
      if (dbUser) {
        const bookingFilter = {
          $or: [{ student: dbUser._id }, { tutor: dbUser._id }],
          status: { $in: ['confirmed', 'accepted', 'completed'] }
        };
        if (start && end) {
          bookingFilter.startTime = { $gte: new Date(start), $lte: new Date(end) };
        }
        bookings = await Booking.find(bookingFilter)
          .populate('student', 'name')
          .populate('tutor', 'name');
      }
    } catch {}

    const events = [
      ...sessions.map(s => ({
        id: s._id,
        title: s.title,
        start: s.startTime,
        end: s.endTime,
        color: s.color || '#2d5be3',
        type: s.type || 'study',
        description: s.description,
        folder: s.folder,
        source: 'session'
      })),
      ...bookings.map(b => ({
        id: b._id,
        title: `Tutoring: ${b.subject || 'Session'} with ${b.tutor?.name || b.student?.name || 'Tutor'}`,
        start: b.startTime,
        end: new Date(new Date(b.startTime).getTime() + (b.durationMinutes || 60) * 60000),
        color: '#16a34a',
        type: 'tutoring',
        description: `Status: ${b.status}`,
        source: 'booking'
      }))
    ];

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update session
router.put('/sessions/:id', auth, async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Not found' });
    if (session.userId !== req.user.cognitoId) return res.status(403).json({ message: 'Not allowed' });

    const { title, description, folder, startTime, endTime, color, type, completed } = req.body;
    if (title !== undefined) session.title = title;
    if (description !== undefined) session.description = description;
    if (folder !== undefined) session.folder = folder;
    if (startTime) session.startTime = new Date(startTime);
    if (endTime) session.endTime = new Date(endTime);
    if (color !== undefined) session.color = color;
    if (type !== undefined) session.type = type;
    if (completed !== undefined) session.completed = completed;
    await session.save();
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete session
router.delete('/sessions/:id', auth, async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Not found' });
    if (session.userId !== req.user.cognitoId) return res.status(403).json({ message: 'Not allowed' });
    await session.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
