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

useTestDb();

function app() {
  const a = express();
  a.use(express.json());
  a.use('/api/tickets', require('../routes/tickets'));
  return a;
}

const studentHeaders = {
  'x-test-cognito': 'cog-s',
  'x-test-email': 's@x.com',
  'x-test-name': 'Sam',
  'x-test-role': 'student',
};

const adminHeaders = {
  'x-test-cognito': 'cog-a',
  'x-test-email': 'a@x.com',
  'x-test-name': 'Admin A',
  'x-test-role': 'admin',
};

beforeEach(async () => {
  await User.create([
    { cognitoId: 'cog-s', email: 's@x.com', name: 'Sam', role: 'student' },
    { cognitoId: 'cog-a', email: 'a@x.com', name: 'Admin A', role: 'admin' },
  ]);
});

describe('help desk tickets', () => {
  test('student submits a ticket', async () => {
    const res = await request(app()).post('/api/tickets').set(studentHeaders)
      .send({ category: 'technical', message: 'Login is broken' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('open');
  });

  test('rejects empty message', async () => {
    const res = await request(app()).post('/api/tickets').set(studentHeaders).send({ message: '' });
    expect(res.status).toBe(400);
  });

  test('student only sees own tickets', async () => {
    await request(app()).post('/api/tickets').set(studentHeaders).send({ message: 'mine' });
    const other = { ...studentHeaders, 'x-test-cognito': 'other-cog', 'x-test-email': 'o@x.com' };
    await User.create({ cognitoId: 'other-cog', email: 'o@x.com', name: 'Other', role: 'student' });
    await request(app()).post('/api/tickets').set(other).send({ message: 'not mine' });

    const list = await request(app()).get('/api/tickets').set(studentHeaders);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].message).toBe('mine');
  });

  test('admin responds and marks answered', async () => {
    const t = await request(app()).post('/api/tickets').set(studentHeaders).send({ message: 'help' });
    const res = await request(app()).patch('/api/tickets/' + t.body._id).set(adminHeaders)
      .send({ response: 'Try clearing your cache', status: 'answered' });
    expect(res.status).toBe(200);
    expect(res.body.response).toContain('cache');
    expect(res.body.status).toBe('answered');
  });

  test('student cannot patch a ticket', async () => {
    const t = await request(app()).post('/api/tickets').set(studentHeaders).send({ message: 'help' });
    const res = await request(app()).patch('/api/tickets/' + t.body._id).set(studentHeaders)
      .send({ response: 'self-serve' });
    expect(res.status).toBe(403);
  });
});
