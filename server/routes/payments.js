const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const loadUser = require('../middleware/loadUser');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } catch (e) {
    console.warn('stripe package missing:', e.message);
  }
}

// Step 1 — create a PaymentIntent for a booking. Returns clientSecret.
router.post('/intent', auth, loadUser, async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (String(booking.student) !== String(req.dbUser._id)) {
      return res.status(403).json({ message: 'Not your booking' });
    }
    if (booking.status !== 'accepted') {
      return res.status(400).json({ message: 'Booking is not accepted yet' });
    }
    if (!stripe) {
      return res.status(501).json({ message: 'Stripe is not configured on the server' });
    }

    const cents = Math.round(Number(amount) * 100);
    if (!cents || cents < 50) {
      return res.status(400).json({ message: 'Amount must be at least $0.50' });
    }

    const intent = await stripe.paymentIntents.create({
      amount: cents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        bookingId: String(booking._id),
        studentId: String(req.dbUser._id),
        tutorId: String(booking.tutor),
      },
    });

    // Create a pending Payment row so we can reconcile on confirm
    const payment = await Payment.create({
      booking: booking._id,
      student: req.dbUser._id,
      amount: Number(amount),
      method: 'card',
      status: 'pending',
      stripePaymentIntentId: intent.id,
    });

    res.json({ clientSecret: intent.client_secret, paymentId: payment._id });
  } catch (err) {
    console.error('intent create:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Step 2 — after the client confirms with Stripe, hit this to flip the booking.
// We re-fetch the Intent from Stripe rather than trusting the client.
router.post('/confirm', auth, loadUser, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) return res.status(400).json({ message: 'paymentIntentId required' });
    if (!stripe) return res.status(501).json({ message: 'Stripe is not configured' });

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const payment = await Payment.findOne({ stripePaymentIntentId: intent.id });
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });
    if (String(payment.student) !== String(req.dbUser._id)) {
      return res.status(403).json({ message: 'Not your payment' });
    }

    if (intent.status === 'succeeded') {
      payment.status = 'succeeded';
      await payment.save();

      const booking = await Booking.findById(payment.booking);
      if (booking && booking.status === 'accepted') {
        booking.status = 'confirmed';
        booking.payment = payment._id;
        await booking.save();
      }
      return res.json({ payment, bookingConfirmed: true });
    }

    // Anything else — record and let the client show what happened
    payment.status = intent.status === 'requires_payment_method' ? 'failed' : 'pending';
    await payment.save();
    res.status(402).json({ message: `Payment status: ${intent.status}`, payment });
  } catch (err) {
    console.error('payment confirm:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fake-mode endpoint kept for dev without Stripe keys.
router.post('/', auth, loadUser, async (req, res) => {
  try {
    if (stripe) {
      return res.status(410).json({ message: 'Use /payments/intent + /payments/confirm — real Stripe is configured' });
    }
    const { bookingId, amount, method } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (String(booking.student) !== String(req.dbUser._id)) {
      return res.status(403).json({ message: 'Not your booking' });
    }
    if (booking.status !== 'accepted') {
      return res.status(400).json({ message: 'Booking is not accepted yet' });
    }

    const ok = method !== 'fail';
    const payment = await Payment.create({
      booking: booking._id,
      student: req.dbUser._id,
      amount,
      method: method === 'fail' ? 'card' : (method || 'card'),
      status: ok ? 'succeeded' : 'failed',
      stripePaymentIntentId: ok ? 'test_' + Date.now() : null,
    });

    if (ok) {
      booking.status = 'confirmed';
      booking.payment = payment._id;
      await booking.save();
      return res.json({ payment, booking });
    }
    res.status(402).json({ message: 'Payment failed', payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', auth, loadUser, async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.dbUser._id })
      .populate('booking')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
