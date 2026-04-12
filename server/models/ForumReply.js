const mongoose = require('mongoose');

const forumReplySchema = new mongoose.Schema({
  post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumPost',
    required: true,
    index: true,
  },
  author_id: {
    type: String,
    required: true,
  },
  author_name: {
    type: String,
    required: true,
  },
  author_role: {
    type: String,
    enum: ['student', 'tutor', 'admin'],
    default: 'student',
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 3000,
  },
  likes: {
    type: [String], // array of user_ids who liked
    default: [],
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ForumReply', forumReplySchema);
