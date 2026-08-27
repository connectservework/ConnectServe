const Certificate = require('../models/Certificate');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// @desc    Get all certificates earned by logged in user
// @route   GET /api/certificates/my
// @access  Private
const getMyCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find({ user: req.user._id })
      .sort({ issueDate: -1 })
      .populate('event', 'title date location category banner')
      .populate('organization', 'name username avatar orgDetails');

    return sendSuccess(res, 'My certificates fetched.', { certificates });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify certificate by unique certificateCode
// @route   GET /api/certificates/verify/:code
// @access  Public
const verifyCertificate = async (req, res, next) => {
  try {
    const { code } = req.params;
    const certificate = await Certificate.findOne({
      certificateCode: code.toUpperCase().trim(),
    })
      .populate('user', 'name username avatar')
      .populate('event', 'title date location category')
      .populate('organization', 'name username avatar orgDetails');

    if (!certificate) {
      return sendError(res, 'Certificate not found or invalid certificate code.', 404);
    }

    return sendSuccess(res, 'Certificate verified successfully.', { certificate });
  } catch (error) {
    next(error);
  }
};

// @desc    Get certificate by ID
// @route   GET /api/certificates/:id
// @access  Public
const getCertificateById = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('user', 'name username avatar')
      .populate('event', 'title date location category')
      .populate('organization', 'name username avatar orgDetails');

    if (!certificate) {
      return sendError(res, 'Certificate not found.', 404);
    }

    return sendSuccess(res, 'Certificate loaded.', { certificate });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyCertificates,
  verifyCertificate,
  getCertificateById,
};
