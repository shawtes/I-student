const mongoose = require('mongoose');

const UsageSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true }, // YYYY-MM-DD in UTC
  count: { type: Number, default: 0 },
});

UsageSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Usage', UsageSchema);
