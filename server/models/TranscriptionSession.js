const mongoose = require('mongoose');

const TranscriptionSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, default: 'Untitled lecture' },
  folder: { type: String, default: 'root' },
  transcript: { type: String, required: true },
  durationSeconds: Number,
  summary: String,
  keyPoints: [String],
  glossary: [{ term: String, definition: String }],
  actionItems: [String],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('TranscriptionSession', TranscriptionSessionSchema);
