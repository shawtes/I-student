const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const loadUser = require('../middleware/loadUser');
const Progress = require('../models/Progress');
const Booking = require('../models/Booking');

// Get my progress (student) or a student's progress (tutor)
router.get('/', auth, loadUser, async (req, res) => {
  try {
    const studentId = req.query.student || req.dbUser._id;

    // tutors may only view students they've worked with
    if (req.dbUser.role === 'tutor' && String(studentId) !== String(req.dbUser._id)) {
      const worked = await Booking.findOne({ tutor: req.dbUser._id, student: studentId });
      if (!worked) return res.status(403).json({ message: 'Not allowed' });
    }
    if (req.dbUser.role === 'student' && String(studentId) !== String(req.dbUser._id)) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const rows = await Progress.find({ student: studentId }).sort({ updatedAt: -1 });

    // derived live from bookings
    const bookings = await Booking.find({ student: studentId });
    const sessionsAttended = bookings.filter(b => b.status === 'completed').length;
    const sessionsScheduled = bookings.filter(b => ['confirmed', 'accepted', 'pending'].includes(b.status)).length;

    res.json({ notes: rows, sessionsAttended, sessionsScheduled });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Tutor adds/updates a progress note for a student
router.post('/', auth, loadUser, async (req, res) => {
  try {
    if (req.dbUser.role !== 'tutor' && req.dbUser.role !== 'admin') {
      return res.status(403).json({ message: 'Only tutors can write progress notes' });
    }
    const { student, subject, notes, assignmentsCompleted, assignmentsTotal } = req.body;
    if (!student) return res.status(400).json({ message: 'student required' });

    const row = await Progress.create({
      student,
      subject,
      notes,
      assignmentsCompleted,
      assignmentsTotal,
      updatedBy: req.dbUser._id,
      updatedAt: new Date()
    });
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
