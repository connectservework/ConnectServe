const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { uploadToCloudinary } = require('../config/cloudinary');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// @desc    Get all active conversations for current user
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'name username avatar role orgDetails')
      .populate('lastMessage');

    return sendSuccess(res, 'Conversations retrieved.', { conversations });
  } catch (error) {
    next(error);
  }
};

// @desc    Get or Create conversation with another user
// @route   POST /api/chat/conversations
// @access  Private
const getOrCreateConversation = async (req, res, next) => {
  try {
    const { recipientId } = req.body;
    const currentUserId = req.user._id;

    if (!recipientId) {
      return sendError(res, 'Recipient ID is required.', 400);
    }

    if (recipientId.toString() === currentUserId.toString()) {
      return sendError(res, 'Cannot start a chat with yourself.', 400);
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return sendError(res, 'Recipient not found.', 404);
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, recipientId], $size: 2 },
    })
      .populate('participants', 'name username avatar role orgDetails')
      .populate('lastMessage');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, recipientId],
        lastMessageText: '',
      });
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name username avatar role orgDetails');
    }

    return sendSuccess(res, 'Conversation ready.', { conversation });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages in a conversation
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findOne({
      _id: id,
      participants: req.user._id,
    });

    if (!conversation) {
      return sendError(res, 'Conversation not found or unauthorized.', 404);
    }

    const messages = await Message.find({ conversation: id })
      .sort({ createdAt: 1 })
      .populate('sender', 'name username avatar');

    // Mark messages from other participant as read
    await Message.updateMany(
      { conversation: id, recipient: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return sendSuccess(res, 'Messages loaded.', { messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message in a conversation
// @route   POST /api/chat/conversations/:id/messages
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text, recipientId } = req.body;

    if (!text && !req.file) {
      return sendError(res, 'Message text or attachment is required.', 400);
    }

    const conversation = await Conversation.findOne({
      _id: id,
      participants: req.user._id,
    });

    if (!conversation) {
      return sendError(res, 'Conversation not found.', 404);
    }

    const otherParticipantId = conversation.participants.find(
      p => p.toString() !== req.user._id.toString()
    ) || recipientId;

    let media = { url: '', public_id: '' };
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'connectserve/chat', {
        transformation: [{ width: 800, crop: 'limit' }],
        mimetype: req.file.mimetype,
      });
      media = {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      };
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      recipient: otherParticipantId,
      text: text || (media.url ? 'Sent an attachment' : ''),
      media,
    });

    conversation.lastMessage = message._id;
    conversation.lastMessageText = message.text;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name username avatar');

    // Emit live message to Socket.IO room
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${conversation._id}`).emit('new_message', populatedMessage);
      io.to(`user:${otherParticipantId}`).emit('direct_message_alert', {
        conversationId: conversation._id,
        sender: req.user,
        message: populatedMessage,
      });
    }

    return sendSuccess(res, 'Message sent.', { message: populatedMessage }, null, 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
};
