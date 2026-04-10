const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const loadUser = require('../middleware/loadUser');
const Availability = require('../models/Availability');

// List my availability (tutor)
router.get('/me', auth, loadUser, async (req, res) => {
  try {
    const slots = await Availability.find({ tutor: req.dbUser._id }).sort({ day: 1, startTime: 1 });
    res.json(slots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List a specific tutor's availability (student browsing)
router.get('/tutor/:tutorId', auth, async (req, res) => {
  try {
    const slots = await Availability.find({ tutor: req.params.tutorId }).sort({ day: 1, startTime: 1 });
    res.json(slots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a slot
router.post('/', auth, loadUser, async (req, res) => {
  try {
    if (req.dbUser.role !== 'tutor' && req.dbUser.role !== 'admin') {
      return res.status(403).json({ message: 'Only tutors can set availability' });
    }

    const { day, startTime, endTime, unavailableDate } = req.body;
    if (!day || !startTime || !endTime) {
      return res.status(400).json({ message: 'day, startTime and endTime are required' });
    }
    if (startTime >= endTime) {
      return res.status(400).json({ message: 'startTime must be before endTime' });
    }

    // reject overlapping slots on the same day
    const overlap = await Availability.findOne({
      tutor: req.dbUser._id,
      day,
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });
    if (overlap) {
      return res.status(409).json({ message: 'Overlaps an existing slot' });
    }

    const slot = await Availability.create({
      tutor: req.dbUser._id,
      day,
      startTime,
      endTime,
      unavailableDate
    });
    res.status(201).json(slot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a slot
router.delete('/:id', auth, loadUser, async (req, res) => {
  try {
    const slot = await Availability.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: 'Not found' });
    if (String(slot.tutor) !== String(req.dbUser._id)) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    await slot.deleteOne();
    res.json({ message: 'Removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
