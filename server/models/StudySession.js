const mongoose = require('mongoose');

const StudySessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: { type: String, required: true },
  description: String,
  folder: { type: String, default: 'root' },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  color: { type: String, default: '#2d5be3' },
  type: {
    type: String,
    enum: ['study', 'tutoring', 'exam', 'assignment', 'other'],
    default: 'study'
  },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudySession', StudySessionSchema);
