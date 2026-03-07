const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Group = require('../models/Group');

// Find study partners based on interests and availability
router.get('/find', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    // Find users with similar interests
    const partners = await User.find({
      _id: { $ne: req.user._id },
      role: 'student',
      interests: { $in: currentUser.interests }
    }).select('-password').limit(20);

    res.json(partners);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send partner request
router.post('/request', auth, async (req, res) => {
  try {
    const { partnerId } = req.body;

    const user = await User.findById(req.user._id);
    
    if (!user.studyPartners.includes(partnerId)) {
      user.studyPartners.push(partnerId);
      await user.save();
    }

    res.json({ message: 'Partner added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's study partners
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('studyPartners', '-password');
    res.json(user.studyPartners);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create study group
router.post('/groups', auth, async (req, res) => {
  try {
    const { name, description, course, members } = req.body;

    const group = new Group({
      name,
      description,
      course,
      admin: req.user._id,
      members: [req.user._id, ...(members || [])]
    });

    await group.save();

    // Add group to users
    await User.updateMany(
      { _id: { $in: group.members } },
      { $push: { groups: group._id } }
    );

    res.status(201).json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's groups
router.get('/groups', auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('admin', 'name email')
      .populate('members', 'name email');
    
    res.json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
