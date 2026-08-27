const User = require('../models/User');
const Post = require('../models/Post');
const EventRegistration = require('../models/EventRegistration');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// @desc    Get user profile by ID or username
// @route   GET /api/users/:idOrUsername
// @access  Public (Optional Auth)
const getProfile = async (req, res, next) => {
  try {
    const { idOrUsername } = req.params;
    let user;

    if (idOrUsername.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(idOrUsername).populate('followers', 'name username avatar role').populate('following', 'name username avatar role');
    } else {
      user = await User.findOne({ username: idOrUsername.toLowerCase() }).populate('followers', 'name username avatar role').populate('following', 'name username avatar role');
    }

    if (!user || user.isBanned) {
      return sendError(res, 'User profile not found.', 404);
    }

    // Fetch user's recent posts
    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate('author', 'name username avatar role orgDetails')
      .populate('eventTag', 'title date category');

    // If user is volunteer, fetch certificates and stats
    let certificates = [];
    let completedEventsCount = 0;
    if (user.role === 'user') {
      certificates = await Certificate.find({ user: user._id }).sort({ issueDate: -1 });
      completedEventsCount = await EventRegistration.countDocuments({ user: user._id, attended: true });
    }

    const isFollowing = req.user ? user.followers.some(f => f._id.toString() === req.user._id.toString()) : false;

    // Check visibility permissions for Sensitive Info (Email & Mobile Number)
    // Visible only if viewer is the profile owner OR viewer is an admin
    const viewerId = req.user ? req.user._id.toString() : null;
    const viewerRole = req.user ? req.user.role : null;
    const isOwner = viewerId && viewerId === user._id.toString();
    const isAdmin = viewerRole === 'admin';

    const userObj = user.toObject();

    if (!isOwner && !isAdmin) {
      delete userObj.email;
      delete userObj.mobileNumber;
      delete userObj.countryCode;
    }

    return sendSuccess(res, 'Profile retrieved successfully.', {
      user: userObj,
      posts,
      certificates,
      completedEventsCount,
      isFollowing,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile & avatar/banner
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 'User not found.', 404);
    }

    const {
      name,
      bio,
      location,
      skills,
      interests,
      socialLinks,
      orgDetails,
      username,
      gender,
      institution,
      countryCode,
      mobileNumber,
      state,
      country,
      pincode,
    } = req.body;

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (gender !== undefined) user.gender = gender;
    if (institution !== undefined) user.institution = institution;
    if (state !== undefined) user.state = state;
    if (country !== undefined) user.country = country;
    if (pincode !== undefined) user.pincode = pincode;
    if (countryCode !== undefined) user.countryCode = countryCode;

    if (mobileNumber !== undefined) {
      const cleanMobile = mobileNumber.trim();
      if (cleanMobile && cleanMobile !== user.mobileNumber) {
        const existing = await User.findOne({ mobileNumber: cleanMobile, _id: { $ne: user._id } });
        if (existing) {
          return sendError(res, 'This mobile number is already registered to another account.', 400);
        }
      }
      user.mobileNumber = cleanMobile;
    }

    if (skills) {
      user.skills = typeof skills === 'string' ? JSON.parse(skills) : skills;
    }
    if (interests) {
      user.interests = typeof interests === 'string' ? JSON.parse(interests) : interests;
    }
    if (socialLinks) {
      const parsedLinks = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
      user.socialLinks = { ...user.socialLinks, ...parsedLinks };
    }

    if (username && username !== user.username) {
      const exists = await User.findOne({ username: username.toLowerCase(), _id: { $ne: user._id } });
      if (exists) {
        return sendError(res, 'Username is already taken.', 400);
      }
      user.username = username.toLowerCase();
    }

    if (user.role === 'organization' && orgDetails) {
      const parsedOrg = typeof orgDetails === 'string' ? JSON.parse(orgDetails) : orgDetails;
      user.orgDetails = {
        ...user.orgDetails,
        mission: parsedOrg.mission !== undefined ? parsedOrg.mission : user.orgDetails.mission,
        registrationNumber: parsedOrg.registrationNumber !== undefined ? parsedOrg.registrationNumber : user.orgDetails.registrationNumber,
        contactPerson: parsedOrg.contactPerson !== undefined ? parsedOrg.contactPerson : user.orgDetails.contactPerson,
        foundedYear: parsedOrg.foundedYear !== undefined ? parsedOrg.foundedYear : user.orgDetails.foundedYear,
        category: parsedOrg.category !== undefined ? parsedOrg.category : user.orgDetails.category,
      };
    }

    // Handle avatar upload if file sent
    if (req.files && req.files.avatar && req.files.avatar[0]) {
      const file = req.files.avatar[0];
      if (user.avatar?.public_id) {
        await deleteFromCloudinary(user.avatar.public_id);
      }
      const uploadResult = await uploadToCloudinary(file.buffer, 'connectserve/profiles', {
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
        mimetype: file.mimetype,
      });
      user.avatar = {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      };
    }

    // Handle banner upload if file sent
    if (req.files && req.files.banner && req.files.banner[0]) {
      const file = req.files.banner[0];
      if (user.banner?.public_id) {
        await deleteFromCloudinary(user.banner.public_id);
      }
      const uploadResult = await uploadToCloudinary(file.buffer, 'connectserve/profiles', {
        transformation: [{ width: 1200, height: 400, crop: 'fill' }],
        mimetype: file.mimetype,
      });
      user.banner = {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      };
    }

    await user.save();

    return sendSuccess(res, 'Profile updated successfully.', { user });
  } catch (error) {
    next(error);
  }
};

// @desc    Follow / Unfollow user or organization
// @route   POST /api/users/:id/follow
// @access  Private
const toggleFollowUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return sendError(res, 'You cannot follow yourself.', 400);
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) {
      return sendError(res, 'User not found.', 404);
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);
      await currentUser.save();
      await targetUser.save();

      return sendSuccess(res, `Unfollowed ${targetUser.name}.`, { isFollowing: false });
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
      await currentUser.save();
      await targetUser.save();

      // Create notification
      const notification = await Notification.create({
        recipient: targetUser._id,
        sender: currentUser._id,
        type: 'follow',
        title: 'New Follower',
        message: `${currentUser.name} started following you.`,
        entityId: currentUser._id,
        entityType: 'user',
        link: `/profile/${currentUser.username || currentUser._id}`,
      });

      // Socket notification emit
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${targetUser._id}`).emit('notification', notification);
      }

      return sendSuccess(res, `Following ${targetUser.name}.`, { isFollowing: true });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get top volunteers leaderboard
// @route   GET /api/users/leaderboard
// @access  Public
const getLeaderboard = async (req, res, next) => {
  try {
    const { timeframe = 'all', limit = 20 } = req.query;

    const query = { role: 'user', isBanned: false, isActive: true };

    const volunteers = await User.find(query)
      .select('name username avatar bio location volunteerHours badges createdAt')
      .sort({ volunteerHours: -1, createdAt: 1 })
      .limit(parseInt(limit, 10));

    const rankedVolunteers = volunteers.map((vol, index) => ({
      rank: index + 1,
      ...vol.toObject(),
    }));

    return sendSuccess(res, 'Leaderboard retrieved successfully.', {
      volunteers: rankedVolunteers,
      timeframe,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search users and organizations
// @route   GET /api/users/search
// @access  Public
const searchUsers = async (req, res, next) => {
  try {
    const { q, role, page = 1, limit = 15 } = req.query;
    const query = { isBanned: false, isActive: true };

    if (role) {
      query.role = role;
    }

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
        { skills: { $in: [new RegExp(q, 'i')] } },
        { 'orgDetails.category': { $regex: q, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const users = await User.find(query)
      .select('name username avatar role bio location skills orgDetails volunteerHours badges')
      .skip(skip)
      .limit(parseInt(limit, 10))
      .sort({ volunteerHours: -1, 'orgDetails.isVerified': -1 });

    const total = await User.countDocuments(query);

    return sendSuccess(res, 'Users search results.', {
      users,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account and all associated data
// @route   DELETE /api/users/profile
// @access  Private
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found.', 404);
    }

    // Delete avatar and banner from Cloudinary if they are custom uploads
    try {
      if (user.avatar?.public_id && user.avatar.public_id.trim() !== '') {
        await deleteFromCloudinary(user.avatar.public_id);
      }
      if (user.banner?.public_id && user.banner.public_id.trim() !== '') {
        await deleteFromCloudinary(user.banner.public_id);
      }
    } catch (cloudErr) {
      // Non-fatal – continue with DB cleanup
    }

    // Delete user's posts and associated media
    const Post = require('../models/Post');
    const Event = require('../models/Event');

    const userPosts = await Post.find({ author: userId });
    for (const post of userPosts) {
      if (post.mediaUrl && post.mediaPublicId) {
        try { await deleteFromCloudinary(post.mediaPublicId); } catch (_) {}
      }
    }
    await Post.deleteMany({ author: userId });

    // If org: delete their events
    if (user.role === 'organization') {
      await Event.deleteMany({ organizer: userId });
      await EventRegistration.deleteMany({ event: { $in: await Event.find({ organizer: userId }).distinct('_id') } });
    }

    // Delete registrations
    await EventRegistration.deleteMany({ user: userId });

    // Delete certificates
    await Certificate.deleteMany({ user: userId });

    // Delete notifications involving user
    await Notification.deleteMany({ $or: [{ recipient: userId }, { sender: userId }] });

    // Pull from other users' followers/following arrays
    await User.updateMany(
      { $or: [{ followers: userId }, { following: userId }] },
      { $pull: { followers: userId, following: userId } }
    );

    // Finally delete the user document
    await User.findByIdAndDelete(userId);

    return sendSuccess(res, 'Account successfully deleted. We are sorry to see you go.', {});
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  toggleFollowUser,
  getLeaderboard,
  searchUsers,
  deleteAccount,
};
