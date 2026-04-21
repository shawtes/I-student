const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Subscription = require('../models/Subscription');

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try { stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); }
  catch (e) { console.warn('stripe unavailable for subscriptions:', e.message); }
}

const PLANS = {
  free:    { name: 'Free',    price: 0,     features: ['15 AI flashcards/day', 'Basic tutor search', 'File upload (500MB)', 'Forum access'] },
  pro:     { name: 'Pro',     price: 9.99,  features: ['Unlimited AI flashcards', 'Priority tutor matching', 'File upload (10GB)', 'Advanced study tools', 'No ads'] },
  premium: { name: 'Premium', price: 19.99, features: ['Everything in Pro', '2 free tutoring hours/month', 'PDF export for study guides', 'Priority support', 'Early access to new features'] },
};

// Get available plans
router.get('/plans', (req, res) => {
  res.json(PLANS);
});

// Get today's AI usage for current user
router.get('/usage', auth, async (req, res) => {
  try {
    const { getUsage } = require('../middleware/aiQuota');
    const usage = await getUsage(req.user.cognitoId);
    res.json(usage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
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

// Stripe Checkout — kicks off a hosted payment page for a plan upgrade.
// Returns a URL the client should redirect to. On success, Stripe sends the
// user back to /student/billing?checkout=success&session_id=... and the client
// calls /subscriptions/checkout/verify to flip the plan.
router.post('/checkout', auth, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan] || plan === 'free') {
      return res.status(400).json({ message: 'Invalid plan' });
    }
    if (!stripe) {
      return res.status(501).json({ message: 'Stripe is not configured on the server' });
    }

    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // one-time demo charge; swap to 'subscription' for real recurring
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `I-Student ${PLANS[plan].name}` },
          unit_amount: Math.round(PLANS[plan].price * 100),
        },
        quantity: 1,
      }],
      success_url: `${frontend}/student/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontend}/student/billing?checkout=cancelled`,
      metadata: {
        userId: req.user.cognitoId,
        plan,
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('checkout create:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Verify a Checkout Session and flip the plan. Client calls this when Stripe
// redirects back with ?session_id=.... We never trust the client — re-fetch
// the session from Stripe and only flip on payment_status === 'paid'.
router.post('/checkout/verify', auth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ message: 'sessionId required' });
    if (!stripe) return res.status(501).json({ message: 'Stripe not configured' });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.userId !== req.user.cognitoId) {
      return res.status(403).json({ message: 'Not your checkout session' });
    }
    if (session.payment_status !== 'paid') {
      return res.status(402).json({ message: `Not paid: ${session.payment_status}` });
    }

    const plan = session.metadata.plan;
    const amount = (session.amount_total || 0) / 100;
    const renewsAt = new Date();
    renewsAt.setMonth(renewsAt.getMonth() + 1);

    const sub = await Subscription.findOneAndUpdate(
      { userId: req.user.cognitoId },
      {
        $set: { plan, status: 'active', renewsAt, cancelledAt: null },
        $push: { paymentHistory: { amount, status: 'succeeded', method: 'card' } },
      },
      { upsert: true, new: true }
    );

    res.json({ ...sub.toObject(), planDetails: PLANS[sub.plan] });
  } catch (err) {
    console.error('checkout verify:', err);
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
