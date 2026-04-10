const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  stars: { type: Number, min: 1, max: 5, required: true },
  comment: String,
  createdAt: { type: Date, default: Date.now }
});

// one rating per student per booking
RatingSchema.index({ booking: 1, student: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Rating', RatingSchema);
