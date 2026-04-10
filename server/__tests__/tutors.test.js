jest.mock('../middleware/auth', () => (req, res, next) => {
  req.user = { cognitoId: 'cog-s', email: 's@x.com', name: 'S', role: 'student' };
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
const Availability = require('../models/Availability');

useTestDb();

function app() {
  const a = express();
  a.use(express.json());
  a.use('/api/tutors', require('../routes/tutors'));
  return a;
}

describe('tutor search', () => {
  beforeEach(async () => {
    await User.create([
      { cognitoId: 'c-t1', email: 't1@x.com', name: 'Math Tutor', role: 'tutor', subjects: ['Math', 'Physics'], ratingAverage: 4.5, ratingCount: 10 },
      { cognitoId: 'c-t2', email: 't2@x.com', name: 'Bio Tutor', role: 'tutor', subjects: ['Biology'], ratingAverage: 4.8, ratingCount: 5 },
      { cognitoId: 'c-s', email: 's@x.com', name: 'A Student', role: 'student' },
    ]);
  });

  test('filters by subject', async () => {
    const res = await request(app()).get('/api/tutors/search?subject=Math');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Math Tutor');
  });

  test('returns all tutors when no filter', async () => {
    const res = await request(app()).get('/api/tutors/search');
    expect(res.body).toHaveLength(2);
  });

  test('excludes students', async () => {
    const res = await request(app()).get('/api/tutors/search');
    const names = res.body.map(t => t.name);
    expect(names).not.toContain('A Student');
  });

  test('filters by day using availability intersection', async () => {
    const t1 = await User.findOne({ name: 'Math Tutor' });
    await Availability.create({ tutor: t1._id, day: 'Mon', startTime: '10:00', endTime: '11:00' });
    const res = await request(app()).get('/api/tutors/search?day=Mon');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Math Tutor');
  });

  test('subject filter is case-insensitive', async () => {
    const res = await request(app()).get('/api/tutors/search?subject=math');
    expect(res.body).toHaveLength(1);
  });
});
