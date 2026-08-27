const mongoose = require('mongoose');

const EventRegistrationSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'attended', 'cancelled'],
    default: 'pending',
  },
  attended: {
    type: Boolean,
    default: false,
  },
  hoursLogged: {
    type: Number,
    default: 0,
  },
  notes: {
    type: String,
    default: '',
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
  statusUpdatedAt: {
    type: Date,
  },
  attendanceMarkedAt: {
    type: Date,
  },
  certificateIssued: {
    type: Boolean,
    default: false,
  },
  reviewGiven: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

EventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });
EventRegistrationSchema.index({ user: 1, status: 1 });
EventRegistrationSchema.index({ event: 1, status: 1 });

module.exports = mongoose.model('EventRegistration', EventRegistrationSchema);
