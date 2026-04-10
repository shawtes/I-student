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
  apiLimiter: (req, res, next) => next(),
  aiLimiter: (req, res, next) => next(),
}));

const express = require('express');
const request = require('supertest');
const { useTestDb } = require('./testDb');
const User = require('../models/User');

useTestDb();

function app() {
  const a = express();
  a.use(express.json());
  a.use('/api/bookings', require('../routes/bookings'));
  a.use('/api/payments', require('../routes/payments'));
  return a;
}

async function seed() {
  const tutor = await User.create({
    cognitoId: 'cog-t',
    email: 't@x.com',
    name: 'Tutor T',
    role: 'tutor',
  });
  const student = await User.create({
    cognitoId: 'cog-s',
    email: 's@x.com',
    name: 'Student S',
    role: 'student',
  });
  return { tutor, student };
}

function h(u) {
  return {
    'x-test-cognito': u.cognitoId,
    'x-test-email': u.email,
    'x-test-name': u.name,
    'x-test-role': u.role,
  };
}

describe('bookings + payments', () => {
  test('full happy path: request -> accept -> pay -> confirmed', async () => {
    const { tutor, student } = await seed();

    const req1 = await request(app())
      .post('/api/bookings')
      .set(h(student))
      .send({
        tutorId: tutor._id,
        subject: 'Calc II',
        startTime: '2026-06-01T10:00:00Z',
        durationMinutes: 60,
      });
    expect(req1.status).toBe(201);
    expect(req1.body.status).toBe('pending');

    const accept = await request(app())
      .patch(`/api/bookings/${req1.body._id}/respond`)
      .set(h(tutor))
      .send({ action: 'accept' });
    expect(accept.status).toBe(200);
    expect(accept.body.status).toBe('accepted');

    const pay = await request(app())
      .post('/api/payments')
      .set(h(student))
      .send({ bookingId: req1.body._id, amount: 50, method: 'card' });
    expect(pay.status).toBe(200);
    expect(pay.body.payment.status).toBe('succeeded');
    expect(pay.body.booking.status).toBe('confirmed');
  });

  test('double-booking same tutor slot is rejected', async () => {
    const { tutor, student } = await seed();
    const first = await request(app()).post('/api/bookings').set(h(student)).send({
      tutorId: tutor._id,
      startTime: '2026-06-01T10:00:00Z',
    });
    expect(first.status).toBe(201);

    const second = await request(app()).post('/api/bookings').set(h(student)).send({
      tutorId: tutor._id,
      startTime: '2026-06-01T10:00:00Z',
    });
    expect(second.status).toBe(409);
  });

  test('tutor decline prevents payment', async () => {
    const { tutor, student } = await seed();
    const b = await request(app()).post('/api/bookings').set(h(student)).send({
      tutorId: tutor._id,
      startTime: '2026-06-01T11:00:00Z',
    });
    await request(app()).patch(`/api/bookings/${b.body._id}/respond`).set(h(tutor)).send({ action: 'decline' });

    const pay = await request(app()).post('/api/payments').set(h(student)).send({
      bookingId: b.body._id,
      amount: 50,
      method: 'card',
    });
    expect(pay.status).toBe(400);
  });

  test('failing payment does not confirm booking', async () => {
    const { tutor, student } = await seed();
    const b = await request(app()).post('/api/bookings').set(h(student)).send({
      tutorId: tutor._id,
      startTime: '2026-06-01T12:00:00Z',
    });
    await request(app()).patch(`/api/bookings/${b.body._id}/respond`).set(h(tutor)).send({ action: 'accept' });

    const pay = await request(app()).post('/api/payments').set(h(student)).send({
      bookingId: b.body._id,
      amount: 50,
      method: 'fail',
    });
    expect(pay.status).toBe(402);
  });
});
