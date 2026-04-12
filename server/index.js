const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const { apiLimiter } = require('./middleware/rateLimiter');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiting to all API routes
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/files', require('./routes/files'));
app.use('/api/transcription', require('./routes/transcription'));
app.use('/api/tutoring', require('./routes/tutoring'));
app.use('/api/tutors', require('./routes/tutors'));
app.use('/api/availability', require('./routes/availability'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/helpdesk', require('./routes/helpdesk'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/flashcards', require('./routes/flashcards'));
app.use('/api/study', require('./routes/study'));
app.use('/api/scheduling', require('./routes/scheduling'));
app.use('/api/partners', require('./routes/partners'));
app.use('/api/admin', require('./routes/admin'));

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'I-Student API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// SPA fallback — serve index.html for any non-API route in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
