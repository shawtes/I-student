const mongoose = require('mongoose');

const forumPostSchema = new mongoose.Schema({
  author_id: {
    type: String,
    required: true,
    index: true,
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
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000,
  },
  category: {
    type: String,
    required: true,
    enum: [
      'General',
      'Mathematics',
      'Science',
      'English',
      'History',
      'Computer Science',
      'Study Tips',
      'Tutoring',
      'Other',
    ],
    default: 'General',
  },
  likes: {
    type: [String], // array of user_ids who liked
    default: [],
  },
  reply_count: {
    type: Number,
    default: 0,
  },
  is_pinned: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Keep updated_at current on save
forumPostSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('ForumPost', forumPostSchema);
