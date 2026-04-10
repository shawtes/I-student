const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subject: String,
  assignmentsCompleted: { type: Number, default: 0 },
  assignmentsTotal: { type: Number, default: 0 },
  sessionsAttended: { type: Number, default: 0 },
  sessionsScheduled: { type: Number, default: 0 },
  notes: String,
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Progress', ProgressSchema);
