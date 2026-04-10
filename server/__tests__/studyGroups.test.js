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
  a.use('/api/partners', require('../routes/partners'));
  return a;
}

const owner = {
  'x-test-cognito': 'cog-o',
  'x-test-email': 'o@x.com',
  'x-test-name': 'Owner',
  'x-test-role': 'student',
};
const joiner = {
  'x-test-cognito': 'cog-j',
  'x-test-email': 'j@x.com',
  'x-test-name': 'Joiner',
  'x-test-role': 'student',
};

beforeEach(async () => {
  await User.create([
    { cognitoId: 'cog-o', email: 'o@x.com', name: 'Owner', role: 'student', interests: ['math'] },
    { cognitoId: 'cog-j', email: 'j@x.com', name: 'Joiner', role: 'student', interests: ['math'] },
  ]);
});

describe('study groups', () => {
  test('create a group with valid member emails', async () => {
    const res = await request(app()).post('/api/partners/groups').set(owner).send({
      name: 'Study Club',
      description: 'for finals',
      memberEmails: ['j@x.com'],
    });
    expect(res.status).toBe(201);
    expect(res.body.members).toHaveLength(2);
  });

  test('create with unknown email returns 422 with missing list', async () => {
    const res = await request(app()).post('/api/partners/groups').set(owner).send({
      name: 'Bad group',
      memberEmails: ['ghost@x.com'],
    });
    expect(res.status).toBe(422);
    expect(res.body.missing).toContain('ghost@x.com');
  });

  test('join request -> admin approves -> joiner is a member', async () => {
    const g = await request(app()).post('/api/partners/groups').set(owner).send({ name: 'Club' });
    await request(app()).post(`/api/partners/groups/${g.body._id}/join`).set(joiner);
    const j = await request(app())
      .patch(`/api/partners/groups/${g.body._id}/requests/${(await User.findOne({ email: 'j@x.com' }))._id}`)
      .set(owner)
      .send({ action: 'approve' });
    expect(j.status).toBe(200);
    expect(j.body.members).toHaveLength(2);
  });

  test('non-admin cannot approve requests', async () => {
    const g = await request(app()).post('/api/partners/groups').set(owner).send({ name: 'Club' });
    await request(app()).post(`/api/partners/groups/${g.body._id}/join`).set(joiner);
    const joinerUser = await User.findOne({ email: 'j@x.com' });
    const r = await request(app())
      .patch(`/api/partners/groups/${g.body._id}/requests/${joinerUser._id}`)
      .set(joiner)
      .send({ action: 'approve' });
    expect(r.status).toBe(403);
  });
});
