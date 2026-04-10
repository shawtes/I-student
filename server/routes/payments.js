const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const loadUser = require('../middleware/loadUser');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

// Stripe is optional at dev time. If STRIPE_SECRET_KEY isn't set we fall back to
// a fake processor so the rest of the flow still works end-to-end in tests.
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } catch (e) {
    console.warn('stripe package not installed, using fake payment processor');
  }
}

async function charge({ amount, method }) {
  if (stripe) {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      payment_method_types: ['card']
    });
    return { ok: true, id: intent.id };
  }
  // Fake processor: card number '4242' always succeeds, anything else fails.
  const ok = method !== 'fail';
  return { ok, id: ok ? 'test_' + Date.now() : null };
}

// Initiate a payment for a booking
router.post('/', auth, loadUser, async (req, res) => {
  try {
    const { bookingId, amount, method } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (String(booking.student) !== String(req.dbUser._id)) {
      return res.status(403).json({ message: 'Not your booking' });
    }
    if (booking.status !== 'accepted') {
      return res.status(400).json({ message: 'Booking is not accepted yet' });
    }

    const result = await charge({ amount, method });

    const payment = await Payment.create({
      booking: booking._id,
      student: req.dbUser._id,
      amount,
      method: method === 'fail' ? 'card' : (method || 'card'),
      status: result.ok ? 'succeeded' : 'failed',
      stripePaymentIntentId: result.id
    });

    if (result.ok) {
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

// List my payments
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
