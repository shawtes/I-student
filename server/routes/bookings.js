const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const loadUser = require('../middleware/loadUser');
const Booking = require('../models/Booking');
const User = require('../models/User');

// List my bookings (student or tutor)
router.get('/', auth, loadUser, async (req, res) => {
  try {
    const filter = req.dbUser.role === 'tutor'
      ? { tutor: req.dbUser._id }
      : { student: req.dbUser._id };
    const bookings = await Booking.find(filter)
      .populate('student', 'name email')
      .populate('tutor', 'name email subjects')
      .sort({ startTime: -1 });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Request a session
router.post('/', auth, loadUser, async (req, res) => {
  try {
    const { tutorId, subject, startTime, durationMinutes } = req.body;
    if (!tutorId || !startTime) {
      return res.status(400).json({ message: 'tutorId and startTime are required' });
    }

    const tutor = await User.findById(tutorId);
    if (!tutor || tutor.role !== 'tutor') {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    const start = new Date(startTime);
    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({ message: 'Invalid startTime' });
    }

    try {
      const booking = await Booking.create({
        student: req.dbUser._id,
        tutor: tutorId,
        subject,
        startTime: start,
        durationMinutes: durationMinutes || 60,
        status: 'pending'
      });
      res.status(201).json(booking);
    } catch (e) {
      if (e.code === 11000) {
        return res.status(409).json({ message: 'That time slot is already taken' });
      }
      throw e;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Tutor accepts / declines
router.patch('/:id/respond', auth, loadUser, async (req, res) => {
  try {
    const { action } = req.body; // 'accept' | 'decline'
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Not found' });
    if (String(booking.tutor) !== String(req.dbUser._id)) {
      return res.status(403).json({ message: 'Not your booking' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Booking is not pending' });
    }
    if (action !== 'accept' && action !== 'decline') {
      return res.status(400).json({ message: 'action must be accept or decline' });
    }
    booking.status = action === 'accept' ? 'accepted' : 'declined';
    await booking.save();
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel
router.delete('/:id', auth, loadUser, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Not found' });
    const isParty = String(booking.student) === String(req.dbUser._id)
      || String(booking.tutor) === String(req.dbUser._id);
    if (!isParty) return res.status(403).json({ message: 'Not allowed' });
    booking.status = 'cancelled';
    await booking.save();
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
