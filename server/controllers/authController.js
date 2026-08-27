const User = require('../models/User');
const { generateTokens, REFRESH_SECRET } = require('../middleware/authMiddleware');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { sendEmail } = require('../utils/emailService');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// @desc    Register a new user or organization
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      username,
      orgDetails,
      bio,
      location,
      skills,
      gender,
      institution,
      countryCode,
      mobileNumber,
      state,
      country,
      pincode,
    } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 'An account with this email already exists.', 400);
    }

    if (mobileNumber && mobileNumber.trim()) {
      const existingMobile = await User.findOne({ mobileNumber: mobileNumber.trim() });
      if (existingMobile) {
        return sendError(res, 'An account with this mobile number already exists.', 400);
      }
    }

    const generatedUsername = username || email.split('@')[0] + Math.floor(100 + Math.random() * 900);

    const user = await User.create({
      name,
      username: generatedUsername,
      email: email.toLowerCase(),
      password,
      role: role || 'user',
      bio: bio || '',
      gender: gender || '',
      institution: institution || '',
      countryCode: countryCode || '+91',
      mobileNumber: mobileNumber ? mobileNumber.trim() : '',
      location: location || '',
      state: state || '',
      country: country || '',
      pincode: pincode || '',
      skills: skills || [],
      orgDetails: role === 'organization' ? {
        mission: orgDetails?.mission || '',
        registrationNumber: orgDetails?.registrationNumber || '',
        isVerified: false,
        category: orgDetails?.category || 'General Community',
      } : undefined,
    });

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    const userObj = user.toObject();
    delete userObj.password;

    return sendSuccess(
      res,
      'Registration successful. Welcome to ConnectServe!',
      { user: userObj, accessToken, refreshToken },
      null,
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get tokens (supports Email or Mobile Number)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password, identifier } = req.body;
    const loginInput = (identifier || email || '').trim();

    if (!loginInput || !password) {
      return sendError(res, 'Please provide both email/mobile number and password.', 400);
    }

    let user;
    if (loginInput.includes('@')) {
      user = await User.findOne({ email: loginInput.toLowerCase() }).select('+password');
    } else {
      const cleanNumber = loginInput.replace(/[\s-]/g, '');
      user = await User.findOne({
        $or: [
          { mobileNumber: loginInput },
          { mobileNumber: cleanNumber },
          { username: loginInput.toLowerCase() },
        ],
      }).select('+password');
    }

    if (!user) {
      return sendError(res, 'Invalid credentials. Please check your email/mobile number and password.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials. Please check your email/mobile number and password.', 401);
    }

    if (user.isBanned) {
      return sendError(res, 'Your account has been suspended. Please contact support.', 403);
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    const userObj = user.toObject();
    delete userObj.password;

    return sendSuccess(res, 'Logged in successfully.', {
      user: userObj,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 'User not found.', 404);
    }
    return sendSuccess(res, 'Current user profile fetched.', { user });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return sendError(res, 'Refresh token required.', 400);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, REFRESH_SECRET);
    } catch (err) {
      return sendError(res, 'Invalid or expired refresh token. Please login again.', 401);
    }

    const user = await User.findById(decoded.id);
    if (!user || user.isBanned || !user.isActive) {
      return sendError(res, 'User not authorized or inactive.', 403);
    }

    const tokens = generateTokens(user._id, user.role);

    return sendSuccess(res, 'Token refreshed successfully.', {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return sendError(res, 'Current password does not match.', 400);
    }

    user.password = newPassword;
    await user.save();

    return sendSuccess(res, 'Password updated successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Update email address
// @route   PUT /api/auth/email
// @access  Private
const updateEmail = async (req, res, next) => {
  try {
    const { newEmail, password } = req.body;
    if (!newEmail || !password) {
      return sendError(res, 'Please provide both new email and your current password.', 400);
    }

    const cleanEmail = newEmail.trim().toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail, _id: { $ne: req.user._id } });
    if (existingUser) {
      return sendError(res, 'An account with this email address already exists.', 400);
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Password confirmation failed. Incorrect password.', 400);
    }

    user.email = cleanEmail;
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    return sendSuccess(res, 'Email address updated successfully.', { user: userObj });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password - Send Reset Token via Email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, 'Please provide an email address.', 400);
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return sendError(res, 'No account found with that email address.', 404);
    }

    // Generate 6-digit reset code / token
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenHash = crypto.createHash('sha256').update(resetCode).digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins validity
    await user.save();

    const emailSubject = 'Password Reset Request - ConnectServe';
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #059669;">Reset Your Password</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>You requested a password reset for your ConnectServe account.</p>
        <p>Your password reset code is:</p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #166534;">${resetCode}</span>
        </div>
        <p>This code will expire in 15 minutes.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 25px;">If you did not request this, please ignore this email.</p>
      </div>
    `;

    const emailResult = await sendEmail(user.email, emailSubject, emailBody);

    if (!emailResult.success && !emailResult.simulated) {
      return sendError(res, `Failed to send email: ${emailResult.error || 'SMTP delivery error'}`, 500);
    }

    return sendSuccess(res, `Password reset code sent to ${user.email}.`);
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password using Code
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { email, resetCode, newPassword } = req.body;
    if (!email || !resetCode || !newPassword) {
      return sendError(res, 'Please provide email, reset code, and new password.', 400);
    }

    const resetTokenHash = crypto.createHash('sha256').update(resetCode.trim()).digest('hex');

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return sendError(res, 'Invalid or expired password reset code.', 400);
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return sendSuccess(res, 'Password reset successful! You can now log in with your new password.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  refreshToken,
  updatePassword,
  updateEmail,
  forgotPassword,
  resetPassword,
};
