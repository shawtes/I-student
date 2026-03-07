const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get or create current user from Cognito token
router.get('/me', auth, async (req, res) => {
  try {
    let user = await User.findOne({ cognitoId: req.user.cognitoId });

    if (!user) {
      // first time this Cognito user hits our backend - create a record
      user = new User({
        cognitoId: req.user.cognitoId,
        email: req.user.email,
        name: req.user.name,
        role: 'student'
      });
      await user.save();
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, bio, major, year, interests, availability } = req.body;

    let user = await User.findOne({ cognitoId: req.user.cognitoId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    Object.assign(user, { name, bio, major, year, interests, availability });
    await user.save();

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
