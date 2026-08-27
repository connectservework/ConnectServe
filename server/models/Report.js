const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetType: {
    type: String,
    enum: ['post', 'comment', 'user', 'event'],
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  reason: {
    type: String,
    enum: ['spam', 'harassment', 'hate_speech', 'inappropriate_content', 'fraud', 'misinformation', 'other'],
    required: true,
  },
  details: {
    type: String,
    default: '',
    maxlength: [500, 'Details cannot exceed 500 characters'],
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'dismissed'],
    default: 'pending',
  },
  resolutionNotes: {
    type: String,
    default: '',
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ targetId: 1, targetType: 1 });

module.exports = mongoose.model('Report', ReportSchema);
