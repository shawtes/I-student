const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  body: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const ForumPostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: String,
  title: { type: String, required: true },
  body: { type: String, required: true },
  replies: [ReplySchema],
  createdAt: { type: Date, default: Date.now }
});

ForumPostSchema.index({ subject: 1, createdAt: -1 });

module.exports = mongoose.model('ForumPost', ForumPostSchema);
