const mongoose = require('mongoose');

const FlashcardSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  deck: { type: String, required: true },
  topic: String,
  question: { type: String, required: true },
  answer: { type: String, required: true },
  source: {
    type: String,
    enum: ['manual', 'ai'],
    default: 'manual'
  },
  sourceFile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  },
  // spaced-repetition state
  ease: { type: Number, default: 2.5 },
  interval: { type: Number, default: 1 },
  dueAt: { type: Date, default: Date.now },
  lastReviewedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Flashcard', FlashcardSchema);
