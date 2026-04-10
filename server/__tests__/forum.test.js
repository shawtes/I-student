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
  a.use('/api/forum', require('../routes/forum'));
  return a;
}

const alice = {
  'x-test-cognito': 'cog-alice',
  'x-test-email': 'alice@x.com',
  'x-test-name': 'Alice',
  'x-test-role': 'student',
};
const bob = {
  'x-test-cognito': 'cog-bob',
  'x-test-email': 'bob@x.com',
  'x-test-name': 'Bob',
  'x-test-role': 'student',
};

beforeEach(async () => {
  await User.create([
    { cognitoId: 'cog-alice', email: 'alice@x.com', name: 'Alice', role: 'student' },
    { cognitoId: 'cog-bob', email: 'bob@x.com', name: 'Bob', role: 'student' },
  ]);
});

describe('forum', () => {
  test('create post and list it', async () => {
    const r = await request(app()).post('/api/forum').set(alice)
      .send({ title: 'Calc question', body: 'How do limits work?', subject: 'Calc II' });
    expect(r.status).toBe(201);

    const list = await request(app()).get('/api/forum').set(bob);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].title).toBe('Calc question');
  });

  test('reply adds to post', async () => {
    const p = await request(app()).post('/api/forum').set(alice).send({ title: 't', body: 'b' });
    const r = await request(app()).post(`/api/forum/${p.body._id}/replies`).set(bob).send({ body: 'here is how' });
    expect(r.status).toBe(201);
    expect(r.body.replies).toHaveLength(1);
    expect(r.body.replies[0].body).toBe('here is how');
  });

  test('subject filter', async () => {
    await request(app()).post('/api/forum').set(alice).send({ title: 'a', body: 'x', subject: 'Bio' });
    await request(app()).post('/api/forum').set(alice).send({ title: 'b', body: 'y', subject: 'Calc' });
    const list = await request(app()).get('/api/forum?subject=Bio').set(bob);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].subject).toBe('Bio');
  });

  test('non-author cannot delete', async () => {
    const p = await request(app()).post('/api/forum').set(alice).send({ title: 't', body: 'b' });
    const del = await request(app()).delete('/api/forum/' + p.body._id).set(bob);
    expect(del.status).toBe(403);
  });

  test('empty body rejected', async () => {
    const r = await request(app()).post('/api/forum').set(alice).send({ title: 't' });
    expect(r.status).toBe(400);
  });
});
