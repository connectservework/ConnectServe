const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  certificateCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  volunteerName: {
    type: String,
    required: true,
  },
  eventTitle: {
    type: String,
    required: true,
  },
  organizationName: {
    type: String,
    required: true,
  },
  hours: {
    type: Number,
    required: true,
  },
  issueDate: {
    type: Date,
    default: Date.now,
  },
  badgeAwarded: {
    type: String,
    default: 'Community Service Certificate',
  },
  pdfUrl: {
    url: { type: String, default: '' },
    public_id: { type: String, default: '' },
  },
  isRevoked: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

CertificateSchema.index({ user: 1 });
CertificateSchema.index({ organization: 1 });
CertificateSchema.index({ event: 1 });

module.exports = mongoose.model('Certificate', CertificateSchema);
