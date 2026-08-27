const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Minimum rating is 1'],
    max: [5, 'Maximum rating is 5'],
  },
  comment: {
    type: String,
    required: [true, 'Review feedback is required'],
    trim: true,
    maxlength: [1000, 'Review cannot exceed 1000 characters'],
  },
}, {
  timestamps: true,
});

ReviewSchema.index({ event: 1, user: 1 }, { unique: true });
ReviewSchema.index({ event: 1, createdAt: -1 });

module.exports = mongoose.model('Review', ReviewSchema);
