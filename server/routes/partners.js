const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const loadUser = require('../middleware/loadUser');
const User = require('../models/User');
const Group = require('../models/Group');

// Find study partners based on shared interests
router.get('/find', auth, loadUser, async (req, res) => {
  try {
    const me = req.dbUser;
    const partners = await User.find({
      _id: { $ne: me._id },
      role: 'student',
      interests: me.interests?.length ? { $in: me.interests } : { $exists: true }
    }).select('name email bio major year interests').limit(20);
    res.json(partners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a partner
router.post('/request', auth, loadUser, async (req, res) => {
  try {
    const { partnerId } = req.body;
    if (!partnerId) return res.status(400).json({ message: 'partnerId required' });
    const me = req.dbUser;
    if (!me.studyPartners.map(String).includes(String(partnerId))) {
      me.studyPartners.push(partnerId);
      await me.save();
    }
    res.json({ message: 'Partner added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// My partners
router.get('/', auth, loadUser, async (req, res) => {
  try {
    await req.dbUser.populate('studyPartners', 'name email bio major year');
    res.json(req.dbUser.studyPartners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a group
router.post('/groups', auth, loadUser, async (req, res) => {
  try {
    const { name, description, course, memberEmails } = req.body;
    if (!name) return res.status(400).json({ message: 'name required' });

    let extra = [];
    if (Array.isArray(memberEmails) && memberEmails.length > 0) {
      const found = await User.find({ email: { $in: memberEmails } }).select('_id email');
      const foundEmails = new Set(found.map(u => u.email));
      const missing = memberEmails.filter(e => !foundEmails.has(e));
      if (missing.length) {
        return res.status(422).json({ message: 'Some emails not found', missing });
      }
      extra = found.map(u => u._id);
    }

    const group = await Group.create({
      name,
      description,
      course,
      admin: req.dbUser._id,
      members: [req.dbUser._id, ...extra]
    });

    await User.updateMany(
      { _id: { $in: group.members } },
      { $addToSet: { groups: group._id } }
    );

    res.status(201).json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List groups I'm in
router.get('/groups', auth, loadUser, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.dbUser._id })
      .populate('admin', 'name email')
      .populate('members', 'name email');
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Request to join
router.post('/groups/:id/join', auth, loadUser, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Not found' });
    if (group.members.map(String).includes(String(req.dbUser._id))) {
      return res.status(400).json({ message: 'Already a member' });
    }
    if (!group.pendingRequests.map(String).includes(String(req.dbUser._id))) {
      group.pendingRequests.push(req.dbUser._id);
      await group.save();
    }
    res.json({ message: 'Join request sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin approves or denies a join request
router.patch('/groups/:id/requests/:userId', auth, loadUser, async (req, res) => {
  try {
    const { action } = req.body; // 'approve' | 'deny'
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Not found' });
    if (String(group.admin) !== String(req.dbUser._id)) {
      return res.status(403).json({ message: 'Admin only' });
    }
    const idx = group.pendingRequests.findIndex(u => String(u) === req.params.userId);
    if (idx === -1) return res.status(404).json({ message: 'No such request' });
    group.pendingRequests.splice(idx, 1);
    if (action === 'approve') {
      group.members.push(req.params.userId);
      await User.findByIdAndUpdate(req.params.userId, { $addToSet: { groups: group._id } });
    }
    await group.save();
    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
