jest.mock('../middleware/auth', () => (req, res, next) => {
  req.user = { cognitoId: 'cog-s', email: 's@x.com', name: 'Sam', role: 'student' };
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
  a.use('/api/calendar', require('../routes/calendar'));
  return a;
}

beforeEach(async () => {
  await User.create([
    { cognitoId: 'cog-s', email: 's@x.com', name: 'Sam', role: 'student' },
    { cognitoId: 'cog-t', email: 't@x.com', name: 'Tina', role: 'tutor' },
  ]);
});

describe('calendar', () => {
  test('not linked by default', async () => {
    const r = await request(app()).get('/api/calendar/status');
    expect(r.body.linked).toBe(false);
  });

  test('link stores a token', async () => {
    const r = await request(app()).post('/api/calendar/link').send({
      accessToken: 'tok', refreshToken: 'ref', scope: 'calendar', tokenType: 'Bearer'
    });
    expect(r.body.linked).toBe(true);
    const s = await request(app()).get('/api/calendar/status');
    expect(s.body.linked).toBe(true);
  });

  test('events uses internal fallback when not linked', async () => {
    const s = await User.findOne({ email: 's@x.com' });
    const t = await User.findOne({ email: 't@x.com' });
    await Booking.create({
      student: s._id, tutor: t._id,
      startTime: new Date(Date.now() + 60 * 60 * 1000),
      status: 'confirmed'
    });
    const r = await request(app()).get('/api/calendar/events');
    expect(r.body.source).toBe('internal');
    expect(r.body.events).toHaveLength(1);
  });

  test('unlink removes token', async () => {
    await request(app()).post('/api/calendar/link').send({ accessToken: 'x' });
    await request(app()).delete('/api/calendar/link');
    const s = await request(app()).get('/api/calendar/status');
    expect(s.body.linked).toBe(false);
  });
});
