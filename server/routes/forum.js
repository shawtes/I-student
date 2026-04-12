const express = require('express');
const router = express.Router();
const ForumPost  = require('../models/ForumPost');
const ForumReply = require('../models/ForumReply');
const auth       = require('../middleware/auth');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Pull a consistent userId + name + role from the verified JWT payload.
 * Adjust field names here if your auth middleware sets them differently.
 */
function extractUser(req) {
  const user = req.user;
  return {
    userId:   user.cognitoId || user.sub || user.userId || user._id?.toString(),
    userName: user.name     || user.email  || 'Anonymous',
    userRole: user['custom:role'] || user.role || 'student',
  };
}

function isAdmin(req) {
  const { userRole } = extractUser(req);
  return userRole === 'admin';
}

// ─── POSTS ────────────────────────────────────────────────────────────────────

// GET /api/forum/posts
// List posts — supports ?category=Math&page=1&limit=20&sort=recent|popular
router.get('/posts', auth, async (req, res) => {
  try {
    const { category, sort = 'recent', page = 1, limit = 20 } = req.query;

    const filter = {};
    if (category && category !== 'All') filter.category = category;

    const sortOption =
      sort === 'popular'
        ? { reply_count: -1, created_at: -1 }
        : { is_pinned: -1, created_at: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [posts, total] = await Promise.all([
      ForumPost.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ForumPost.countDocuments(filter),
    ]);

    return res.json({
      posts,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error('Get posts error:', err);
    return res.status(500).json({ error: 'Could not retrieve posts.' });
  }
});

// GET /api/forum/posts/:id
// Single post with its replies
router.get('/posts/:id', auth, async (req, res) => {
  try {
    const post    = await ForumPost.findById(req.params.id).lean();
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    const replies = await ForumReply.find({ post_id: req.params.id })
      .sort({ created_at: 1 })
      .lean();

    return res.json({ post, replies });
  } catch (err) {
    console.error('Get post error:', err);
    return res.status(500).json({ error: 'Could not retrieve post.' });
  }
});

// POST /api/forum/posts
// Create a new post
router.post('/posts', auth, async (req, res) => {
  try {
    const { userId, userName, userRole } = extractUser(req);
    const { title, body, category } = req.body;

    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({ error: 'Title and body are required.' });
    }
    if (!category) {
      return res.status(400).json({ error: 'Category is required.' });
    }

    const post = await ForumPost.create({
      author_id:   userId,
      author_name: userName,
      author_role: userRole,
      title:       title.trim(),
      body:        body.trim(),
      category,
    });

    return res.status(201).json({ post });
  } catch (err) {
    console.error('Create post error:', err);
    return res.status(500).json({ error: 'Could not create post.' });
  }
});

// DELETE /api/forum/posts/:id
// Author or admin can delete a post (also deletes all replies)
router.delete('/posts/:id', auth, async (req, res) => {
  try {
    const { userId } = extractUser(req);
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    if (post.author_id !== userId && !isAdmin(req)) {
      return res.status(403).json({ error: 'Not authorised to delete this post.' });
    }

    await Promise.all([
      ForumPost.findByIdAndDelete(req.params.id),
      ForumReply.deleteMany({ post_id: req.params.id }),
    ]);

    return res.json({ message: 'Post deleted.' });
  } catch (err) {
    console.error('Delete post error:', err);
    return res.status(500).json({ error: 'Could not delete post.' });
  }
});

// POST /api/forum/posts/:id/like
// Toggle like on a post
router.post('/posts/:id/like', auth, async (req, res) => {
  try {
    const { userId } = extractUser(req);
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    const alreadyLiked = post.likes.includes(userId);
    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id !== userId);
    } else {
      post.likes.push(userId);
    }
    await post.save();

    return res.json({ likes: post.likes.length, liked: !alreadyLiked });
  } catch (err) {
    console.error('Like post error:', err);
    return res.status(500).json({ error: 'Could not update like.' });
  }
});

// ─── REPLIES ──────────────────────────────────────────────────────────────────

// POST /api/forum/posts/:id/replies
// Add a reply to a post
router.post('/posts/:id/replies', auth, async (req, res) => {
  try {
    const { userId, userName, userRole } = extractUser(req);
    const { body } = req.body;

    if (!body?.trim()) {
      return res.status(400).json({ error: 'Reply body is required.' });
    }

    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    const reply = await ForumReply.create({
      post_id:     post._id,
      author_id:   userId,
      author_name: userName,
      author_role: userRole,
      body:        body.trim(),
    });

    // Increment reply count on the parent post
    await ForumPost.findByIdAndUpdate(req.params.id, { $inc: { reply_count: 1 } });

    return res.status(201).json({ reply });
  } catch (err) {
    console.error('Create reply error:', err);
    return res.status(500).json({ error: 'Could not post reply.' });
  }
});

// DELETE /api/forum/replies/:id
// Author or admin can delete a reply
router.delete('/replies/:id', auth, async (req, res) => {
  try {
    const { userId } = extractUser(req);
    const reply = await ForumReply.findById(req.params.id);
    if (!reply) return res.status(404).json({ error: 'Reply not found.' });

    if (reply.author_id !== userId && !isAdmin(req)) {
      return res.status(403).json({ error: 'Not authorised to delete this reply.' });
    }

    await ForumReply.findByIdAndDelete(req.params.id);
    await ForumPost.findByIdAndUpdate(reply.post_id, { $inc: { reply_count: -1 } });

    return res.json({ message: 'Reply deleted.' });
  } catch (err) {
    console.error('Delete reply error:', err);
    return res.status(500).json({ error: 'Could not delete reply.' });
  }
});

// POST /api/forum/replies/:id/like
// Toggle like on a reply
router.post('/replies/:id/like', auth, async (req, res) => {
  try {
    const { userId } = extractUser(req);
    const reply = await ForumReply.findById(req.params.id);
    if (!reply) return res.status(404).json({ error: 'Reply not found.' });

    const alreadyLiked = reply.likes.includes(userId);
    if (alreadyLiked) {
      reply.likes = reply.likes.filter((id) => id !== userId);
    } else {
      reply.likes.push(userId);
    }
    await reply.save();

    return res.json({ likes: reply.likes.length, liked: !alreadyLiked });
  } catch (err) {
    console.error('Like reply error:', err);
    return res.status(500).json({ error: 'Could not update like.' });
  }
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────

// GET /api/forum/admin/posts
// Admin: list all posts across all users (with pagination)
router.get('/admin/posts', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only.' });

    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [posts, total] = await Promise.all([
      ForumPost.find().sort({ created_at: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      ForumPost.countDocuments(),
    ]);

    return res.json({ posts, total });
  } catch (err) {
    return res.status(500).json({ error: 'Could not retrieve posts.' });
  }
});

// PATCH /api/forum/admin/posts/:id/pin
// Admin: toggle pin on a post
router.patch('/admin/posts/:id/pin', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only.' });

    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    post.is_pinned = !post.is_pinned;
    await post.save();

    return res.json({ is_pinned: post.is_pinned });
  } catch (err) {
    return res.status(500).json({ error: 'Could not update pin.' });
  }
});

module.exports = router;
