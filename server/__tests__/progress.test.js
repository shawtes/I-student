jest.mock('../middleware/auth', () => (req, res, next) => {
  const id = req.header('x-test-cognito');
  if (!id) return res.status(401).json({ message: 'no auth' });
  req.user = {
    cognitoId: id,
    email: req.header('x-test-email'),
    name: req.header('x-test-name') || 'Test',
    role: req.header('x-test-role') || 'student',
  };
  next();
});
jest.mock('../middleware/rateLimiter', () => ({
  apiLimiter: (r, s, n) => n(),
  aiLimiter: (r, s, n) => n(),
}));

const express = require('express');
const request = require('supertest');
const { useTestDb } = require('./testDb');
const User = require('../models/User');
const Booking = require('../models/Booking');

useTestDb();

function app() {
  const a = express();
  a.use(express.json());
  a.use('/api/progress', require('../routes/progress'));
  return a;
}

const student = {
  'x-test-cognito': 'cog-s',
  'x-test-email': 's@x.com',
  'x-test-name': 'Sam',
  'x-test-role': 'student',
};
const tutor = {
  'x-test-cognito': 'cog-t',
  'x-test-email': 't@x.com',
  'x-test-name': 'Tina',
  'x-test-role': 'tutor',
};

beforeEach(async () => {
  await User.create([
    { cognitoId: 'cog-s', email: 's@x.com', name: 'Sam', role: 'student' },
    { cognitoId: 'cog-t', email: 't@x.com', name: 'Tina', role: 'tutor' },
  ]);
});

describe('progress', () => {
  test('empty progress returns zeros', async () => {
    const r = await request(app()).get('/api/progress').set(student);
    expect(r.status).toBe(200);
    expect(r.body.sessionsAttended).toBe(0);
    expect(r.body.sessionsScheduled).toBe(0);
  });

  test('counts sessions derived from bookings', async () => {
    const s = await User.findOne({ email: 's@x.com' });
    const t = await User.findOne({ email: 't@x.com' });
    await Booking.create([
      { student: s._id, tutor: t._id, startTime: new Date(), status: 'completed' },
      { student: s._id, tutor: t._id, startTime: new Date(Date.now() + 1000), status: 'confirmed' },
      { student: s._id, tutor: t._id, startTime: new Date(Date.now() + 2000), status: 'pending' },
    ]);
    const r = await request(app()).get('/api/progress').set(student);
    expect(r.body.sessionsAttended).toBe(1);
    expect(r.body.sessionsScheduled).toBe(2);
  });

  test('tutor can write a progress note after working with student', async () => {
    const s = await User.findOne({ email: 's@x.com' });
    const t = await User.findOne({ email: 't@x.com' });
    await Booking.create({ student: s._id, tutor: t._id, startTime: new Date(), status: 'completed' });
    const r = await request(app()).post('/api/progress').set(tutor)
      .send({ student: s._id, subject: 'Math', notes: 'Great job on derivatives' });
    expect(r.status).toBe(201);
    expect(r.body.notes).toContain('derivatives');
  });

  test('student cannot view another student progress', async () => {
    await User.create({ cognitoId: 'cog-s2', email: 's2@x.com', name: 'Other', role: 'student' });
    const other = await User.findOne({ email: 's2@x.com' });
    const r = await request(app()).get('/api/progress?student=' + other._id).set(student);
    expect(r.status).toBe(403);
  });
});
