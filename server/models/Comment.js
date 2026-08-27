const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: [true, 'Comment cannot be empty'],
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters'],
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isReported: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

CommentSchema.index({ post: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', CommentSchema);
