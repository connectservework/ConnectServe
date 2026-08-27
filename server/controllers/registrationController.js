const EventRegistration = require('../models/EventRegistration');
const Event = require('../models/Event');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
const { evaluateBadges } = require('../utils/badgeCalculator');
const { sendApplicationStatusEmail } = require('../utils/emailService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// @desc    Register / Apply for an event
// @route   POST /api/events/:id/register
// @access  Private (User/Volunteer)
const registerForEvent = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user._id;
    const { notes } = req.body;

    const event = await Event.findById(eventId).populate('organizer', 'name email');
    if (!event) {
      return sendError(res, 'Event not found.', 404);
    }

    if (event.status === 'cancelled' || event.status === 'completed') {
      return sendError(res, `Cannot register for a ${event.status} event.`, 400);
    }

    if (event.registeredCount >= event.volunteerSlots) {
      return sendError(res, 'Sorry, all volunteer slots for this event are filled.', 400);
    }

    const existing = await EventRegistration.findOne({ event: eventId, user: userId });
    if (existing) {
      if (existing.status === 'cancelled') {
        existing.status = 'pending';
        existing.notes = notes || existing.notes;
        existing.appliedAt = new Date();
        await existing.save();
        return sendSuccess(res, 'Re-applied for event successfully.', { registration: existing });
      }
      return sendError(res, `You already have an active registration (${existing.status}) for this event.`, 400);
    }

    const registration = await EventRegistration.create({
      event: eventId,
      user: userId,
      status: 'pending',
      notes: notes || '',
    });

    // Notify organization
    const notification = await Notification.create({
      recipient: event.organizer._id,
      sender: userId,
      type: 'event_registered',
      title: 'New Volunteer Application',
      message: `${req.user.name} applied to volunteer for "${event.title}".`,
      entityId: event._id,
      entityType: 'event',
      link: `/org/events/${event._id}/applicants`,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${event.organizer._id}`).emit('notification', notification);
    }

    return sendSuccess(res, 'Application submitted successfully. Waiting for organizer confirmation.', {
      registration,
    }, null, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's registered events
// @route   GET /api/registrations/my
// @access  Private
const getMyRegistrations = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { user: req.user._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    const registrations = await EventRegistration.find(query)
      .sort({ appliedAt: -1 })
      .populate({
        path: 'event',
        populate: { path: 'organizer', select: 'name username avatar orgDetails' },
      });

    return sendSuccess(res, 'My registrations fetched.', { registrations });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all applicants for a specific event
// @route   GET /api/events/:id/applicants
// @access  Private (Event Organizer / Admin)
const getEventApplicants = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);

    if (!event) {
      return sendError(res, 'Event not found.', 404);
    }

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to view applicants for this event.', 403);
    }

    const registrations = await EventRegistration.find({ event: eventId })
      .sort({ appliedAt: -1 })
      .populate('user', 'name username email avatar bio location skills volunteerHours badges');

    return sendSuccess(res, 'Event applicants retrieved.', { event, registrations });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or Reject an applicant
// @route   PUT /api/registrations/:id/status
// @access  Private (Event Organizer / Admin)
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    if (!['approved', 'rejected', 'cancelled'].includes(status)) {
      return sendError(res, 'Invalid status provided.', 400);
    }

    const registration = await EventRegistration.findById(req.params.id)
      .populate('event')
      .populate('user');

    if (!registration) {
      return sendError(res, 'Registration not found.', 404);
    }

    const event = registration.event;
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to manage this application.', 403);
    }

    const previousStatus = registration.status;
    registration.status = status;
    registration.statusUpdatedAt = new Date();
    await registration.save();

    // Adjust event registered count
    if (previousStatus !== 'approved' && status === 'approved') {
      await Event.findByIdAndUpdate(event._id, { $inc: { registeredCount: 1 } });
    } else if (previousStatus === 'approved' && (status === 'rejected' || status === 'cancelled')) {
      await Event.findByIdAndUpdate(event._id, { $inc: { registeredCount: -1 } });
    }

    // Send in-app notification & email
    const notification = await Notification.create({
      recipient: registration.user._id,
      sender: req.user._id,
      type: status === 'approved' ? 'event_approved' : 'event_rejected',
      title: status === 'approved' ? 'Application Approved! 🎉' : 'Application Update',
      message: status === 'approved'
        ? `Your application for "${event.title}" has been approved!`
        : `Your application for "${event.title}" was not approved.`,
      entityId: event._id,
      entityType: 'event',
      link: `/events/${event._id}`,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${registration.user._id}`).emit('notification', notification);
    }

    // Fire email notification asynchronously
    sendApplicationStatusEmail(registration.user, event, status, notes);

    return sendSuccess(res, `Applicant status updated to ${status}.`, { registration });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark attendance and log volunteer hours + generate certificate
// @route   POST /api/registrations/:id/attendance
// @access  Private (Event Organizer / Admin)
const markAttendance = async (req, res, next) => {
  try {
    const { attended, customHours } = req.body;
    const registration = await EventRegistration.findById(req.params.id)
      .populate('event')
      .populate('user');

    if (!registration) {
      return sendError(res, 'Registration not found.', 404);
    }

    const event = registration.event;
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to mark attendance for this event.', 403);
    }

    const volunteer = await User.findById(registration.user._id);
    const hoursToLog = Number(customHours) || event.hoursGranted || 0;

    const isAttended = attended === true || attended === 'true';

    if (isAttended && !registration.attended) {
      // Mark attended
      registration.attended = true;
      registration.status = 'attended';
      registration.hoursLogged = hoursToLog;
      registration.attendanceMarkedAt = new Date();

      // Add volunteer hours
      volunteer.volunteerHours = (volunteer.volunteerHours || 0) + hoursToLog;

      // Evaluate new badges
      const newBadges = evaluateBadges(volunteer, event);
      await volunteer.save();

      // Generate Certificate
      const certCode = `CS-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const certificate = await Certificate.create({
        certificateCode: certCode,
        user: volunteer._id,
        event: event._id,
        organization: req.user._id,
        volunteerName: volunteer.name,
        eventTitle: event.title,
        organizationName: req.user.name,
        hours: hoursToLog,
        issueDate: new Date(),
        badgeAwarded: newBadges.length > 0 ? newBadges[0].name : 'Verified Community Volunteer',
      });

      registration.certificateIssued = true;
      await registration.save();

      // Notification
      const notification = await Notification.create({
        recipient: volunteer._id,
        sender: req.user._id,
        type: 'certificate_issued',
        title: 'Volunteer Hours & Certificate Awarded! 🏆',
        message: `You earned ${hoursToLog} hours and a digital certificate for volunteering at "${event.title}".`,
        entityId: certificate._id,
        entityType: 'certificate',
        link: `/certificates`,
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user:${volunteer._id}`).emit('notification', notification);
        io.to(`user:${volunteer._id}`).emit('certificate_earned', certificate);
      }

      return sendSuccess(res, `Attendance confirmed. ${hoursToLog} hours logged and certificate issued.`, {
        registration,
        certificate,
        newBadges,
        updatedHours: volunteer.volunteerHours,
      });
    } else if (!isAttended && registration.attended) {
      // Revoke attendance
      const previousHours = registration.hoursLogged || 0;
      registration.attended = false;
      registration.status = 'approved';
      registration.hoursLogged = 0;
      await registration.save();

      volunteer.volunteerHours = Math.max(0, (volunteer.volunteerHours || 0) - previousHours);
      await volunteer.save();

      return sendSuccess(res, 'Attendance unmarked and hours deducted.', { registration });
    }

    return sendSuccess(res, 'Attendance status saved.', { registration });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerForEvent,
  getMyRegistrations,
  getEventApplicants,
  updateApplicationStatus,
  markAttendance,
};
