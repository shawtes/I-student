const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get or create current user from Cognito token.
// On first hit we also honor a `role` query param if it's one of the
// allowed values, so the signup flow can pick student/tutor/admin up front.
// Once the user record exists this param is ignored - no self-elevation.
router.get('/me', auth, async (req, res) => {
  try {
    let user = await User.findOne({ cognitoId: req.user.cognitoId });

    if (!user) {
      // Only student and tutor can self-register. Admin must be granted by an existing admin.
      const allowed = ['student', 'tutor'];
      const requested = allowed.includes(req.query.role) ? req.query.role : null;
      user = new User({
        cognitoId: req.user.cognitoId,
        email: req.user.email,
        name: req.user.name,
        role: requested || req.user.role || 'student'
      });
      await user.save();
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      courses: user.courses || [],
      subjects: user.subjects || [],
      hourlyRate: user.hourlyRate,
      learningPrefs: user.learningPrefs || [],
      bio: user.bio,
      major: user.major,
      year: user.year
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, bio, major, year, interests, availability, subjects, hourlyRate, learningPrefs, courses } = req.body;

    let user = await User.findOne({ cognitoId: req.user.cognitoId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const patch = { name, bio, major, year, interests, availability, subjects, learningPrefs, courses };
    Object.keys(patch).forEach(k => patch[k] === undefined && delete patch[k]);
    if (hourlyRate !== undefined) patch.hourlyRate = hourlyRate;
    Object.assign(user, patch);
    await user.save();

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
