const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  plan: {
    type: String,
    enum: ['free', 'pro', 'premium'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'past_due'],
    default: 'active'
  },
  startedAt: { type: Date, default: Date.now },
  renewsAt: Date,
  cancelledAt: Date,
  paymentHistory: [{
    amount: Number,
    status: String,
    processedAt: { type: Date, default: Date.now },
    method: String,
  }],
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);
