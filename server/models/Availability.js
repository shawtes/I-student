const mongoose = require('mongoose');

const AvailabilitySchema = new mongoose.Schema({
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  day: {
    type: String,
    enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    required: true
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  // one-off blocks (holidays, personal time) live here instead of day/time
  unavailableDate: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Availability', AvailabilitySchema);
