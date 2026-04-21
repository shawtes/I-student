const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const loadUser = require('../middleware/loadUser');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const User = require('../models/User');
const gcal = require('../services/googleCalendarService');

// Tutor earnings summary
router.get('/earnings', auth, loadUser, async (req, res) => {
  try {
    if (req.dbUser.role !== 'tutor' && req.dbUser.role !== 'admin') {
      return res.status(403).json({ message: 'Tutors only' });
    }
    const bookings = await Booking.find({ tutor: req.dbUser._id })
      .populate('payment')
      .populate('student', 'name email');

    let totalEarned = 0;
    let pendingPayout = 0;
    let sessionsCompleted = 0;
    let sessionsUpcoming = 0;
    const recent = [];

    for (const b of bookings) {
      if (b.status === 'completed' && b.payment?.status === 'succeeded') {
        totalEarned += b.payment.amount;
        sessionsCompleted++;
      }
      if (b.status === 'confirmed' && b.payment?.status === 'succeeded') {
        pendingPayout += b.payment.amount;
        sessionsUpcoming++;
      }
      if (b.payment) {
        recent.push({
          date: b.payment.createdAt,
          student: b.student?.name || 'Unknown',
          subject: b.subject,
          amount: b.payment.amount,
          status: b.status,
        });
      }
    }

    recent.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      totalEarned,
      pendingPayout,
      sessionsCompleted,
      sessionsUpcoming,
      recent: recent.slice(0, 10)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

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

    // When the tutor accepts, try to create a Google Calendar event with a Meet link.
    // If the tutor hasn't linked Google Calendar, this is a no-op — the student/tutor
    // still have the email fallback shown in the UI.
    if (booking.status === 'accepted') {
      try {
        const [tutor, student] = await Promise.all([
          User.findById(booking.tutor).select('email name'),
          User.findById(booking.student).select('email name'),
        ]);
        const result = await gcal.createEventWithMeet(booking.tutor, {
          summary: `Tutoring: ${booking.subject || 'Session'} with ${student?.name || 'student'}`,
          description: `I-Student tutoring session.\nSubject: ${booking.subject || 'General'}`,
          startTime: booking.startTime,
          durationMinutes: booking.durationMinutes,
          attendees: [student?.email, tutor?.email],
        });
        booking.meetingUrl = result.meetUrl;
        booking.googleEventId = result.eventId;
      } catch (e) {
        // Tutor hasn't linked Google, OAuth not configured, etc. Not fatal.
        console.log('Meet event skipped:', e.message);
      }
    }

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
    if (booking.googleEventId) {
      gcal.deleteEvent(booking.tutor, booking.googleEventId).catch(() => {});
    }
    await booking.save();
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
