const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Availability = require('../models/Availability');

// Search tutors. Filters: subject, day, learningPref.
// Ranked by ratingAverage desc, then ratingCount desc.
router.get('/search', auth, async (req, res) => {
  try {
    const { subject, day, pref } = req.query;
    const q = { role: 'tutor' };

    if (subject) q.subjects = { $in: [new RegExp(`^${escape(subject)}$`, 'i')] };
    if (pref) q.learningPrefs = { $in: [new RegExp(`^${escape(pref)}$`, 'i')] };

    let tutors = await User.find(q)
      .select('name email subjects hourlyRate learningPrefs ratingAverage ratingCount bio')
      .sort({ ratingAverage: -1, ratingCount: -1 })
      .limit(50);

    // If day filter is set, intersect with users who have availability that day.
    if (day) {
      const withSlots = await Availability.find({ day }).distinct('tutor');
      const allow = new Set(withSlots.map(String));
      tutors = tutors.filter(t => allow.has(String(t._id)));
    }

    res.json(tutors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a tutor profile
router.get('/:id', auth, async (req, res) => {
  try {
    const tutor = await User.findById(req.params.id)
      .select('name email subjects hourlyRate learningPrefs ratingAverage ratingCount bio');
    if (!tutor || tutor.role !== 'tutor') {
      return res.status(404).json({ message: 'Tutor not found' });
    }
    res.json(tutor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

function escape(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = router;
