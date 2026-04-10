const mongoose = require('mongoose');

const GmailTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  accessToken: { type: String, required: true },
  refreshToken: String,
  scope: String,
  tokenType: String,
  expiresAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GmailToken', GmailTokenSchema);
