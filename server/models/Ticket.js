const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_id: { type: String, required: true },
  sender_name: { type: String, required: true },
  sender_role: {
    type: String,
    enum: ['student', 'tutor', 'admin'],
    default: 'student',
  },
  body: { type: String, required: true, trim: true, maxlength: 3000 },
  sent_at: { type: Date, default: Date.now },
});

const ticketSchema = new mongoose.Schema({
  ticket_number: {
    type: String,
    unique: true,
  },
  author_id: { type: String, required: true, index: true },
  author_name: { type: String, required: true },
  author_email: { type: String, default: '' },
  author_role: {
    type: String,
    enum: ['student', 'tutor', 'admin'],
    default: 'student',
  },

  subject: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },

  category: {
    type: String,
    required: true,
    enum: [
      'Bug Report',
      'Account Issue',
      'Billing / Payment',
      'Tutoring Issue',
      'General Question',
      'Feature Request',
    ],
  },

  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
    index: true,
  },

  // Conversation thread on the ticket
  messages: [messageSchema],

  // Admin who claimed this ticket
  assigned_to_id: { type: String, default: null },
  assigned_to_name: { type: String, default: null },

  created_at: { type: Date, default: Date.now, index: true },
  updated_at: { type: Date, default: Date.now },
  resolved_at: { type: Date, default: null },
});

// Auto-generate a human-readable ticket number before first save
ticketSchema.pre('save', async function (next) {
  if (!this.ticket_number) {
    const count = await mongoose.model('Ticket').countDocuments();
    this.ticket_number = `TKT-${String(count + 1).padStart(5, '0')}`;
  }
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
