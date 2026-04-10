const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: String,
  fileSize: Number,
  storageUrl: String,
  localPath: String,
  s3Key: String,
  transcription: {
    text: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    }
  },
  tags: [String],
  folder: String,
  isPublic: {
    type: Boolean,
    default: false
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('File', FileSchema);
