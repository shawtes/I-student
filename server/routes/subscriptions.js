const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Subscription = require('../models/Subscription');

const PLANS = {
  free:    { name: 'Free',    price: 0,     features: ['15 AI flashcards/day', 'Basic tutor search', 'File upload (500MB)', 'Forum access'] },
  pro:     { name: 'Pro',     price: 9.99,  features: ['Unlimited AI flashcards', 'Priority tutor matching', 'File upload (10GB)', 'Advanced study tools', 'No ads'] },
  premium: { name: 'Premium', price: 19.99, features: ['Everything in Pro', '2 free tutoring hours/month', 'PDF export for study guides', 'Priority support', 'Early access to new features'] },
};

// Get available plans
router.get('/plans', (req, res) => {
  res.json(PLANS);
});

// Get my subscription (creates free one if none exists)
router.get('/me', auth, async (req, res) => {
  try {
    let sub = await Subscription.findOne({ userId: req.user.cognitoId });
    if (!sub) {
      sub = await Subscription.create({
        userId: req.user.cognitoId,
        plan: 'free',
        status: 'active'
      });
    }
    res.json({
      ...sub.toObject(),
      planDetails: PLANS[sub.plan]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upgrade plan (fake payment processor for demo)
router.post('/upgrade', auth, async (req, res) => {
  try {
    const { plan, method } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ message: 'Invalid plan' });

    const amount = PLANS[plan].price;

    // Fake charge — anything except 'fail' succeeds
    const ok = method !== 'fail';

    if (!ok) {
      return res.status(402).json({ message: 'Payment failed' });
    }

    const renewsAt = new Date();
    renewsAt.setMonth(renewsAt.getMonth() + 1);

    const sub = await Subscription.findOneAndUpdate(
      { userId: req.user.cognitoId },
      {
        $set: { plan, status: 'active', renewsAt, cancelledAt: null },
        $push: { paymentHistory: { amount, status: 'succeeded', method: method || 'card' } }
      },
      { upsert: true, new: true }
    );

    res.json({
      ...sub.toObject(),
      planDetails: PLANS[sub.plan]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel
router.post('/cancel', auth, async (req, res) => {
  try {
    const sub = await Subscription.findOneAndUpdate(
      { userId: req.user.cognitoId },
      { $set: { status: 'cancelled', cancelledAt: new Date() } },
      { new: true }
    );
    if (!sub) return res.status(404).json({ message: 'No subscription' });
    res.json(sub);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
