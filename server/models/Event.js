const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [120, 'Event title cannot exceed 120 characters'],
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Environment',
      'Education',
      'Health & Wellness',
      'Animal Welfare',
      'Community Development',
      'Crisis & Disaster Relief',
      'Hunger & Poverty',
      'Elderly Care',
      'Youth Empowerment',
      'Other',
    ],
    default: 'Community Development',
  },
  date: {
    type: Date,
    required: [true, 'Event date is required'],
  },
  endDate: {
    type: Date,
  },
  time: {
    type: String,
    default: '09:00 AM - 01:00 PM',
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
  },
  locationType: {
    type: String,
    enum: ['in-person', 'virtual', 'hybrid'],
    default: 'in-person',
  },
  volunteerSlots: {
    type: Number,
    required: [true, 'Volunteer slots count is required'],
    min: [1, 'Must have at least 1 volunteer slot'],
    default: 20,
  },
  registeredCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  hoursGranted: {
    type: Number,
    required: [true, 'Volunteer hours granted must be specified'],
    default: 4,
    min: 0.5,
  },
  banner: {
    url: {
      type: String,
      default: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200&auto=format&fit=crop&q=80',
    },
    public_id: { type: String, default: '' },
  },
  requirements: [{
    type: String,
    trim: true,
  }],
  skillsNeeded: [{
    type: String,
    trim: true,
  }],
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming',
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

EventSchema.index({ organizer: 1 });
EventSchema.index({ category: 1 });
EventSchema.index({ date: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ locationType: 1 });

EventSchema.virtual('slotsRemaining').get(function () {
  return Math.max(0, this.volunteerSlots - this.registeredCount);
});

module.exports = mongoose.model('Event', EventSchema);
