const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subject: String,
  startTime: { type: Date, required: true },
  durationMinutes: { type: Number, default: 60 },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  meetingUrl: String,
  googleEventId: String,
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

// prevent double-booking the same tutor at the same start time
BookingSchema.index({ tutor: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Booking', BookingSchema);
