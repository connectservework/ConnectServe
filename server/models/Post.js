const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    trim: true,
    maxlength: [2000, 'Post content cannot exceed 2000 characters'],
  },
  media: {
    url: { type: String, default: '' },
    public_id: { type: String, default: '' },
    mediaType: { type: String, enum: ['image', 'video', 'none'], default: 'none' },
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  commentsCount: {
    type: Number,
    default: 0,
  },
  sharesCount: {
    type: Number,
    default: 0,
  },
  eventTag: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
  },
  tags: [{
    type: String,
    trim: true,
  }],
  location: {
    type: String,
    default: '',
  },
  isReported: {
    type: Boolean,
    default: false,
  },
  reportsCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ eventTag: 1 });

PostSchema.virtual('likesCount').get(function () {
  return this.likes ? this.likes.length : 0;
});

module.exports = mongoose.model('Post', PostSchema);
