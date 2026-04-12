const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  cognitoId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'tutor', 'admin'],
    default: 'student'
  },
  // tutor-only profile fields, ignored for students/admins
  subjects: [String],
  hourlyRate: Number,
  learningPrefs: [String],
  ratingAverage: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  courses: [String],
  avatar: String,
  bio: String,
  major: String,
  year: String,
  interests: [String],
  availability: [{
    day: String,
    startTime: String,
    endTime: String
  }],
  studyPartners: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
