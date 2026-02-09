const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const File = require('../models/File');
const Group = require('../models/Group');
const StudyContent = require('../models/StudyContent');

// Get all users (admin only)
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get platform statistics
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const studentCount = await User.countDocuments({ role: 'student' });
    const adminCount = await User.countDocuments({ role: 'admin' });
    const fileCount = await File.countDocuments();
    const groupCount = await Group.countDocuments();
    const contentCount = await StudyContent.countDocuments();

    res.json({
      users: {
        total: userCount,
        students: studentCount,
        admins: adminCount
      },
      files: fileCount,
      groups: groupCount,
      studyContent: contentCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', auth, adminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role (admin only)
router.put('/users/:id/role', auth, adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
