const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Report = require('../models/Report');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res, next) => {
  try {
    const { content, eventTag, tags, location } = req.body;

    if (!content && !req.file) {
      return sendError(res, 'Post must have either text content or an image.', 400);
    }

    let media = { url: '', public_id: '', mediaType: 'none' };

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'connectserve/posts', {
        transformation: [{ width: 1200, crop: 'limit' }],
        mimetype: req.file.mimetype,
      });
      media = {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        mediaType: 'image',
      };
    }

    const parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];

    const post = await Post.create({
      author: req.user._id,
      content: content || '',
      media,
      eventTag: eventTag || undefined,
      tags: parsedTags,
      location: location || '',
    });

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'name username avatar role orgDetails')
      .populate('eventTag', 'title date category banner');

    // Emit live post to followers via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('new_public_post', populatedPost);
    }

    return sendSuccess(res, 'Post published successfully.', { post: populatedPost }, null, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get personalized feed (posts from followed users + own posts + featured)
// @route   GET /api/posts/feed
// @access  Private
const getFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id);
    const followingIds = [...(user.following || []), user._id];

    let query = {
      author: { $in: followingIds },
      isReported: false,
    };

    // If user follows few people, show a blend of following + global posts
    if (followingIds.length <= 1) {
      query = { isReported: false };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name username avatar role orgDetails')
      .populate('eventTag', 'title date category banner location hoursGranted');

    const total = await Post.countDocuments(query);

    return sendSuccess(res, 'Feed loaded successfully.', {
      posts,
      total,
      page,
      pages: Math.ceil(total / limit),
      hasMore: skip + posts.length < total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get explore / public posts
// @route   GET /api/posts/explore
// @access  Public
const getExplorePosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const { tag, search } = req.query;
    const skip = (page - 1) * limit;

    const query = { isReported: false };

    if (tag) {
      query.tags = tag.toLowerCase();
    }

    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name username avatar role orgDetails')
      .populate('eventTag', 'title date category banner location');

    const total = await Post.countDocuments(query);

    return sendSuccess(res, 'Explore posts loaded.', {
      posts,
      total,
      page,
      pages: Math.ceil(total / limit),
      hasMore: skip + posts.length < total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post by ID with comments
// @route   GET /api/posts/:id
// @access  Public
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name username avatar role orgDetails')
      .populate('eventTag', 'title date category banner location');

    if (!post) {
      return sendError(res, 'Post not found.', 404);
    }

    const comments = await Comment.find({ post: post._id })
      .sort({ createdAt: 1 })
      .populate('author', 'name username avatar role');

    return sendSuccess(res, 'Post fetched.', { post, comments });
  } catch (error) {
    next(error);
  }
};

// @desc    Like or Unlike a post
// @route   POST /api/posts/:id/like
// @access  Private
const toggleLikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return sendError(res, 'Post not found.', 404);
    }

    const userId = req.user._id;
    const hasLiked = post.likes.includes(userId);

    if (hasLiked) {
      post.likes.pull(userId);
      await post.save();
      return sendSuccess(res, 'Post unliked.', { isLiked: false, likesCount: post.likes.length });
    } else {
      post.likes.push(userId);
      await post.save();

      // Send notification to post author if not self
      if (post.author.toString() !== userId.toString()) {
        const notification = await Notification.create({
          recipient: post.author,
          sender: userId,
          type: 'like',
          title: 'New Like',
          message: `${req.user.name} liked your post.`,
          entityId: post._id,
          entityType: 'post',
          link: `/posts/${post._id}`,
        });

        const io = req.app.get('io');
        if (io) {
          io.to(`user:${post.author}`).emit('notification', notification);
        }
      }

      return sendSuccess(res, 'Post liked.', { isLiked: true, likesCount: post.likes.length });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to a post
// @route   POST /api/posts/:id/comments
// @access  Private
const addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return sendError(res, 'Comment text is required.', 400);
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return sendError(res, 'Post not found.', 404);
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      content: content.trim(),
    });

    post.commentsCount = (post.commentsCount || 0) + 1;
    await post.save();

    const populatedComment = await Comment.findById(comment._id).populate('author', 'name username avatar role');

    // Notify author if not self
    if (post.author.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'comment',
        title: 'New Comment',
        message: `${req.user.name} commented: "${content.substring(0, 40)}${content.length > 40 ? '...' : ''}"`,
        entityId: post._id,
        entityType: 'post',
        link: `/posts/${post._id}`,
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user:${post.author}`).emit('notification', notification);
      }
    }

    return sendSuccess(res, 'Comment added.', { comment: populatedComment }, null, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment
// @route   DELETE /api/posts/:postId/comments/:commentId
// @access  Private
const deleteComment = async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return sendError(res, 'Comment not found.', 404);
    }

    // Only author or admin can delete
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 'You are not authorized to delete this comment.', 403);
    }

    await comment.deleteOne();
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: -1 } });

    return sendSuccess(res, 'Comment deleted successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return sendError(res, 'Post not found.', 404);
    }

    // Check authorization: author or admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 'You are not authorized to delete this post.', 403);
    }

    // Delete image from Cloudinary if exists
    if (post.media?.public_id) {
      await deleteFromCloudinary(post.media.public_id);
    }

    // Delete comments
    await Comment.deleteMany({ post: post._id });

    // Delete post
    await post.deleteOne();

    return sendSuccess(res, 'Post deleted successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Share / Increment share count
// @route   POST /api/posts/:id/share
// @access  Private
const sharePost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { sharesCount: 1 } },
      { new: true }
    );
    if (!post) {
      return sendError(res, 'Post not found.', 404);
    }
    return sendSuccess(res, 'Post shared.', { sharesCount: post.sharesCount });
  } catch (error) {
    next(error);
  }
};

// @desc    Report post for moderation
// @route   POST /api/posts/:id/report
// @access  Private
const reportPost = async (req, res, next) => {
  try {
    const { reason, details } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) {
      return sendError(res, 'Post not found.', 404);
    }

    const report = await Report.create({
      reporter: req.user._id,
      targetType: 'post',
      targetId: post._id,
      reason: reason || 'inappropriate_content',
      details: details || '',
    });

    post.reportsCount = (post.reportsCount || 0) + 1;
    if (post.reportsCount >= 3) {
      post.isReported = true;
    }
    await post.save();

    return sendSuccess(res, 'Report submitted for review.', { report });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getFeed,
  getExplorePosts,
  getPostById,
  toggleLikePost,
  addComment,
  deleteComment,
  deletePost,
  sharePost,
  reportPost,
};
