const express = require('express');
const router  = express.Router();
const Ticket  = require('../models/Ticket');
const auth    = require('../middleware/auth');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractUser(req) {
  const u = req.user;
  return {
    userId:    u.cognitoId || u.sub || u.userId || u._id?.toString(),
    userName:  u.name      || u.email  || 'User',
    userEmail: u.email     || '',
    userRole:  u['custom:role'] || u.role || 'student',
  };
}

function isAdmin(req) {
  return extractUser(req).userRole === 'admin';
}

const VALID_STATUSES   = ['open', 'in_progress', 'resolved', 'closed'];
const VALID_CATEGORIES = [
  'Bug Report',
  'Account Issue',
  'Billing / Payment',
  'Tutoring Issue',
  'General Question',
  'Feature Request',
];

// ─── STUDENT ROUTES ───────────────────────────────────────────────────────────

// POST /api/helpdesk/tickets
// Submit a new support ticket
router.post('/tickets', auth, async (req, res) => {
  try {
    const { userId, userName, userEmail, userRole } = extractUser(req);
    const { subject, description, category } = req.body;

    if (!subject?.trim() || !description?.trim()) {
      return res.status(400).json({ error: 'Subject and description are required.' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid category.' });
    }

    const ticket = await Ticket.create({
      author_id:    userId,
      author_name:  userName,
      author_email: userEmail,
      author_role:  userRole,
      subject:      subject.trim(),
      description:  description.trim(),
      category,
      // Seed the thread with the original description as the first message
      messages: [{
        sender_id:   userId,
        sender_name: userName,
        sender_role: userRole,
        body:        description.trim(),
      }],
    });

    return res.status(201).json({ ticket });
  } catch (err) {
    console.error('Create ticket error:', err);
    return res.status(500).json({ error: 'Could not create ticket.' });
  }
});

// GET /api/helpdesk/tickets
// List the authenticated user's own tickets
router.get('/tickets', auth, async (req, res) => {
  try {
    const { userId } = extractUser(req);
    const { status, page = 1, limit = 20 } = req.query;

    const filter = { author_id: userId };
    if (status && VALID_STATUSES.includes(status)) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .select('-messages') // exclude thread for list view — load on detail
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Ticket.countDocuments(filter),
    ]);

    return res.json({ tickets, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error('List tickets error:', err);
    return res.status(500).json({ error: 'Could not retrieve tickets.' });
  }
});

// GET /api/helpdesk/tickets/:id
// Get a single ticket with full message thread
router.get('/tickets/:id', auth, async (req, res) => {
  try {
    const { userId } = extractUser(req);
    const ticket = await Ticket.findById(req.params.id).lean();

    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });

    // Only the owner or an admin can view the ticket
    if (ticket.author_id !== userId && !isAdmin(req)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    return res.json({ ticket });
  } catch (err) {
    console.error('Get ticket error:', err);
    return res.status(500).json({ error: 'Could not retrieve ticket.' });
  }
});

// POST /api/helpdesk/tickets/:id/messages
// Add a message to a ticket thread (student reply or admin response)
router.post('/tickets/:id/messages', auth, async (req, res) => {
  try {
    const { userId, userName, userRole } = extractUser(req);
    const { body } = req.body;

    if (!body?.trim()) {
      return res.status(400).json({ error: 'Message body is required.' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });

    // Only the owner or an admin can message on the ticket
    if (ticket.author_id !== userId && !isAdmin(req)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Prevent messaging on closed tickets
    if (ticket.status === 'closed') {
      return res.status(400).json({ error: 'This ticket is closed. Please open a new ticket.' });
    }

    const message = {
      sender_id:   userId,
      sender_name: userName,
      sender_role: userRole,
      body:        body.trim(),
    };

    ticket.messages.push(message);

    // If admin responds, auto-move to in_progress
    if (userRole === 'admin' && ticket.status === 'open') {
      ticket.status = 'in_progress';
    }

    // If student replies on a resolved ticket, re-open it
    if (userRole !== 'admin' && ticket.status === 'resolved') {
      ticket.status = 'open';
    }

    await ticket.save();

    const savedMessage = ticket.messages[ticket.messages.length - 1];
    return res.status(201).json({ message: savedMessage, status: ticket.status });
  } catch (err) {
    console.error('Add message error:', err);
    return res.status(500).json({ error: 'Could not send message.' });
  }
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

// GET /api/helpdesk/admin/tickets
// Admin: list all tickets with optional filters
router.get('/admin/tickets', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only.' });

    const { status, category, page = 1, limit = 30 } = req.query;

    const filter = {};
    if (status   && VALID_STATUSES.includes(status))     filter.status   = status;
    if (category && VALID_CATEGORIES.includes(category)) filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .select('-messages')
        .sort({ status: 1, created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Ticket.countDocuments(filter),
    ]);

    // Summary counts for dashboard stats
    const [openCount, inProgressCount, resolvedCount, closedCount] = await Promise.all([
      Ticket.countDocuments({ status: 'open' }),
      Ticket.countDocuments({ status: 'in_progress' }),
      Ticket.countDocuments({ status: 'resolved' }),
      Ticket.countDocuments({ status: 'closed' }),
    ]);

    return res.json({
      tickets, total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      stats: { open: openCount, in_progress: inProgressCount, resolved: resolvedCount, closed: closedCount },
    });
  } catch (err) {
    console.error('Admin list tickets error:', err);
    return res.status(500).json({ error: 'Could not retrieve tickets.' });
  }
});

// PATCH /api/helpdesk/admin/tickets/:id/status
// Admin: update ticket status and optionally assign it
router.patch('/admin/tickets/:id/status', auth, async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Admin only.' });

    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const { userId, userName } = extractUser(req);
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });

    ticket.status = status;
    ticket.assigned_to_id   = userId;
    ticket.assigned_to_name = userName;

    if (status === 'resolved' || status === 'closed') {
      ticket.resolved_at = new Date();
    }

    await ticket.save();
    return res.json({ ticket });
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({ error: 'Could not update ticket status.' });
  }
});

module.exports = router;
