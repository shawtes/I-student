const mongoose = require('mongoose');

const StudyContentSchema = new mongoose.Schema({
  userId: {
    type: String,
    index: true,
    required: true
  },
  type: {
    type: String,
    enum: ['quiz', 'flashcard', 'guide'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: mongoose.Schema.Types.Mixed,
  sourceFiles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  }],
  tags: [String],
  isPublic: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('StudyContent', StudyContentSchema);
