const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const BadgeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tier: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Special'], default: 'Bronze' },
  icon: { type: String, default: 'Award' },
  description: { type: String },
  earnedAt: { type: Date, default: Date.now },
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [80, 'Name cannot exceed 80 characters'],
  },
  username: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'organization', 'admin'],
    default: 'user',
  },
  avatar: {
    url: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    public_id: { type: String, default: '' },
  },
  banner: {
    url: {
      type: String,
      default: 'https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=1200&auto=format&fit=crop&q=80',
    },
    public_id: { type: String, default: '' },
  },
  bio: {
    type: String,
    default: '',
    maxlength: [500, 'Bio cannot exceed 500 characters'],
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', ''],
    default: '',
  },
  institution: {
    type: String,
    default: '',
    trim: true,
  },
  countryCode: {
    type: String,
    default: '+91',
    trim: true,
  },
  mobileNumber: {
    type: String,
    default: '',
    trim: true,
  },
  location: {
    type: String,
    default: '',
  },
  state: {
    type: String,
    default: '',
    trim: true,
  },
  country: {
    type: String,
    default: '',
    trim: true,
  },
  pincode: {
    type: String,
    default: '',
    trim: true,
  },
  skills: [{
    type: String,
    trim: true,
  }],
  interests: [{
    type: String,
    trim: true,
  }],
  socialLinks: {
    website: { type: String, default: '' },
    twitter: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    instagram: { type: String, default: '' },
    github: { type: String, default: '' },
  },
  orgDetails: {
    mission: { type: String, default: '' },
    registrationNumber: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    contactPerson: { type: String, default: '' },
    foundedYear: { type: Number },
    category: { type: String, default: 'General Community' },
  },
  volunteerHours: {
    type: Number,
    default: 0,
    min: 0,
  },
  badges: [BadgeSchema],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

UserSchema.index({ role: 1 });
UserSchema.index({ volunteerHours: -1 });
UserSchema.index({ 'orgDetails.isVerified': 1 });

// Virtual follower/following counts
UserSchema.virtual('followersCount').get(function () {
  return this.followers ? this.followers.length : 0;
});

UserSchema.virtual('followingCount').get(function () {
  return this.following ? this.following.length : 0;
});

// Password hash hook
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Password verification method
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
