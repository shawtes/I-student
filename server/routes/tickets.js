const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const loadUser = require('../middleware/loadUser');
const Ticket = require('../models/Ticket');

// Open a ticket
router.post('/', auth, loadUser, async (req, res) => {
  try {
    const { category, message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });
    const ticket = await Ticket.create({
      user: req.dbUser._id,
      category: category || 'other',
      message
    });
    res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List: users see their own, admins see everything
router.get('/', auth, loadUser, async (req, res) => {
  try {
    const filter = req.dbUser.role === 'admin' ? {} : { user: req.dbUser._id };
    const tickets = await Ticket.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin responds
router.patch('/:id', auth, loadUser, async (req, res) => {
  try {
    if (req.dbUser.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }
    const { response, status } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Not found' });
    if (response !== undefined) ticket.response = response;
    if (status) ticket.status = status;
    ticket.respondedBy = req.dbUser._id;
    ticket.respondedAt = new Date();
    await ticket.save();
    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
