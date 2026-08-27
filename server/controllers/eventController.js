const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const Review = require('../models/Review');
const User = require('../models/User');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// @desc    Create a new community service event
// @route   POST /api/events
// @access  Private (Organization / Admin)
const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      date,
      endDate,
      time,
      location,
      locationType,
      volunteerSlots,
      hoursGranted,
      requirements,
      skillsNeeded,
    } = req.body;

    let banner = {
      url: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200&auto=format&fit=crop&q=80',
      public_id: '',
    };

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'connectserve/events', {
        transformation: [{ width: 1200, height: 600, crop: 'fill' }],
        mimetype: req.file.mimetype,
      });
      banner = {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      };
    }

    const parsedRequirements = requirements
      ? (typeof requirements === 'string' ? JSON.parse(requirements) : requirements)
      : [];
    const parsedSkills = skillsNeeded
      ? (typeof skillsNeeded === 'string' ? JSON.parse(skillsNeeded) : skillsNeeded)
      : [];

    const event = await Event.create({
      organizer: req.user._id,
      title,
      description,
      category: category || 'Community Development',
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : undefined,
      time: time || '09:00 AM - 01:00 PM',
      location,
      locationType: locationType || 'in-person',
      volunteerSlots: Number(volunteerSlots) || 20,
      hoursGranted: Number(hoursGranted) || 4,
      banner,
      requirements: parsedRequirements,
      skillsNeeded: parsedSkills,
      status: 'upcoming',
    });

    const populatedEvent = await Event.findById(event._id).populate('organizer', 'name username avatar orgDetails');

    // Emit live event announcement
    const io = req.app.get('io');
    if (io) {
      io.emit('new_event_created', populatedEvent);
    }

    return sendSuccess(res, 'Event created successfully.', { event: populatedEvent }, null, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get / Browse community service events with search and filters
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res, next) => {
  try {
    const {
      search,
      category,
      locationType,
      status,
      startDate,
      endDate,
      organizerId,
      page = 1,
      limit = 9,
      sortBy = 'date_asc',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { skillsNeeded: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (locationType && locationType !== 'all') {
      query.locationType = locationType;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (organizerId) {
      query.organizer = organizerId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    let sortOptions = { date: 1 };
    if (sortBy === 'date_desc') sortOptions = { date: -1 };
    if (sortBy === 'hours_desc') sortOptions = { hoursGranted: -1 };
    if (sortBy === 'rating_desc') sortOptions = { averageRating: -1 };
    if (sortBy === 'popular') sortOptions = { registeredCount: -1 };

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const events = await Event.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('organizer', 'name username avatar orgDetails');

    const total = await Event.countDocuments(query);

    return sendSuccess(res, 'Events fetched successfully.', {
      events,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
      hasMore: skip + events.length < total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event by ID with registration status
// @route   GET /api/events/:id
// @access  Public (Optional Auth)
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name username avatar bio location orgDetails');

    if (!event) {
      return sendError(res, 'Event not found.', 404);
    }

    let userRegistration = null;
    if (req.user) {
      userRegistration = await EventRegistration.findOne({
        event: event._id,
        user: req.user._id,
      });
    }

    const reviews = await Review.find({ event: event._id })
      .sort({ createdAt: -1 })
      .populate('user', 'name username avatar');

    return sendSuccess(res, 'Event details loaded.', {
      event,
      userRegistration,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private (Event Organizer / Admin)
const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return sendError(res, 'Event not found.', 404);
    }

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 'You are not authorized to edit this event.', 403);
    }

    const fieldsToUpdate = [
      'title', 'description', 'category', 'date', 'endDate', 'time',
      'location', 'locationType', 'volunteerSlots', 'hoursGranted', 'status',
    ];

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'date' || field === 'endDate') {
          event[field] = new Date(req.body[field]);
        } else if (field === 'volunteerSlots' || field === 'hoursGranted') {
          event[field] = Number(req.body[field]);
        } else {
          event[field] = req.body[field];
        }
      }
    });

    if (req.body.requirements) {
      event.requirements = typeof req.body.requirements === 'string'
        ? JSON.parse(req.body.requirements)
        : req.body.requirements;
    }

    if (req.body.skillsNeeded) {
      event.skillsNeeded = typeof req.body.skillsNeeded === 'string'
        ? JSON.parse(req.body.skillsNeeded)
        : req.body.skillsNeeded;
    }

    if (req.file) {
      if (event.banner?.public_id) {
        await deleteFromCloudinary(event.banner.public_id);
      }
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'connectserve/events', {
        transformation: [{ width: 1200, height: 600, crop: 'fill' }],
        mimetype: req.file.mimetype,
      });
      event.banner = {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      };
    }

    await event.save();
    const updated = await Event.findById(event._id).populate('organizer', 'name username avatar orgDetails');

    return sendSuccess(res, 'Event updated successfully.', { event: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private (Event Organizer / Admin)
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return sendError(res, 'Event not found.', 404);
    }

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 'You are not authorized to delete this event.', 403);
    }

    if (event.banner?.public_id) {
      await deleteFromCloudinary(event.banner.public_id);
    }

    await EventRegistration.deleteMany({ event: event._id });
    await Review.deleteMany({ event: event._id });
    await event.deleteOne();

    return sendSuccess(res, 'Event and associated registrations deleted successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Add review & rating for an attended event
// @route   POST /api/events/:id/reviews
// @access  Private
const addEventReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const eventId = req.params.id;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return sendError(res, 'Event not found.', 404);
    }

    // Verify user attended or registered
    const registration = await EventRegistration.findOne({
      event: eventId,
      user: userId,
      status: { $in: ['approved', 'attended'] },
    });

    if (!registration) {
      return sendError(res, 'You can only review events you were registered or attended.', 403);
    }

    const existingReview = await Review.findOne({ event: eventId, user: userId });
    if (existingReview) {
      return sendError(res, 'You have already reviewed this event.', 400);
    }

    const review = await Review.create({
      event: eventId,
      user: userId,
      rating: Number(rating),
      comment,
    });

    // Recalculate event average rating
    const allReviews = await Review.find({ event: eventId });
    const avg = allReviews.reduce((acc, curr) => acc + curr.rating, 0) / allReviews.length;

    event.averageRating = parseFloat(avg.toFixed(1));
    event.totalRatings = allReviews.length;
    await event.save();

    const populatedReview = await Review.findById(review._id).populate('user', 'name username avatar');

    return sendSuccess(res, 'Review submitted successfully.', { review: populatedReview, averageRating: event.averageRating }, null, 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  addEventReview,
};
