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

const routes = require('../routes/availability');

useTestDb();

function app() {
  const a = express();
  a.use(express.json());
  a.use('/api/availability', routes);
  return a;
}

async function makeTutor() {
  return User.create({
    cognitoId: 'cog-tutor-1',
    email: 'tutor1@example.com',
    name: 'Tina Tutor',
    role: 'tutor',
  });
}

async function makeStudent() {
  return User.create({
    cognitoId: 'cog-student-1',
    email: 'student1@example.com',
    name: 'Sam Student',
    role: 'student',
  });
}

function headers(user) {
  return {
    'x-test-cognito': user.cognitoId,
    'x-test-email': user.email,
    'x-test-name': user.name,
    'x-test-role': user.role,
  };
}

describe('availability', () => {
  test('tutor can create and list a slot', async () => {
    const tutor = await makeTutor();
    const res = await request(app())
      .post('/api/availability')
      .set(headers(tutor))
      .send({ day: 'Mon', startTime: '09:00', endTime: '10:00' });
    expect(res.status).toBe(201);

    const list = await request(app()).get('/api/availability/me').set(headers(tutor));
    expect(list.body).toHaveLength(1);
    expect(list.body[0].day).toBe('Mon');
  });

  test('student cannot create availability', async () => {
    const student = await makeStudent();
    const res = await request(app())
      .post('/api/availability')
      .set(headers(student))
      .send({ day: 'Mon', startTime: '09:00', endTime: '10:00' });
    expect(res.status).toBe(403);
  });

  test('rejects overlapping slot', async () => {
    const tutor = await makeTutor();
    await request(app()).post('/api/availability').set(headers(tutor))
      .send({ day: 'Mon', startTime: '09:00', endTime: '11:00' });
    const res = await request(app()).post('/api/availability').set(headers(tutor))
      .send({ day: 'Mon', startTime: '10:00', endTime: '12:00' });
    expect(res.status).toBe(409);
  });

  test('rejects reversed times', async () => {
    const tutor = await makeTutor();
    const res = await request(app()).post('/api/availability').set(headers(tutor))
      .send({ day: 'Mon', startTime: '12:00', endTime: '09:00' });
    expect(res.status).toBe(400);
  });

  test('tutor can delete own slot', async () => {
    const tutor = await makeTutor();
    const create = await request(app()).post('/api/availability').set(headers(tutor))
      .send({ day: 'Tue', startTime: '13:00', endTime: '14:00' });
    const del = await request(app()).delete('/api/availability/' + create.body._id).set(headers(tutor));
    expect(del.status).toBe(200);
  });
});
