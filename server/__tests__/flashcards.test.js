jest.mock('../middleware/auth', () => (req, res, next) => {
  req.user = { cognitoId: 'cog-s', email: 's@x.com', name: 'Sam', role: 'student' };
  next();
});
jest.mock('../middleware/rateLimiter', () => ({
  apiLimiter: (r, s, n) => n(),
  aiLimiter: (r, s, n) => n(),
}));
jest.mock('../services/flashcardService', () => ({
  generate: jest.fn(async ({ count }) => {
    const n = count || 3;
    return Array.from({ length: n }, (_, i) => ({
      question: `Q${i + 1}?`,
      answer: `A${i + 1}`,
    }));
  }),
}));

const express = require('express');
const request = require('supertest');
const { useTestDb } = require('./testDb');
const User = require('../models/User');

useTestDb();

function app() {
  const a = express();
  a.use(express.json());
  a.use('/api/flashcards', require('../routes/flashcards'));
  return a;
}

beforeEach(async () => {
  await User.create({ cognitoId: 'cog-s', email: 's@x.com', name: 'Sam', role: 'student' });
});

describe('flashcards', () => {
  test('manual create', async () => {
    const r = await request(app()).post('/api/flashcards').send({
      deck: 'Bio', question: 'What is ATP?', answer: 'Energy currency'
    });
    expect(r.status).toBe(201);
    expect(r.body.source).toBe('manual');
  });

  test('ai generate creates multiple cards', async () => {
    const r = await request(app()).post('/api/flashcards/generate').send({
      deck: 'Chem', text: 'Lorem ipsum. Dolor sit amet. Consectetur.', count: 3
    });
    expect(r.status).toBe(201);
    expect(r.body).toHaveLength(3);
    expect(r.body[0].source).toBe('ai');
  });

  test('list decks with counts', async () => {
    await request(app()).post('/api/flashcards').send({ deck: 'Bio', question: 'q1', answer: 'a1' });
    await request(app()).post('/api/flashcards').send({ deck: 'Bio', question: 'q2', answer: 'a2' });
    const r = await request(app()).get('/api/flashcards/decks');
    expect(r.body).toHaveLength(1);
    expect(r.body[0]).toEqual(expect.objectContaining({ deck: 'Bio', count: 2 }));
  });

  test('review bumps interval', async () => {
    const created = await request(app()).post('/api/flashcards').send({ deck: 'd', question: 'q', answer: 'a' });
    const id = created.body._id;
    const r = await request(app()).post(`/api/flashcards/${id}/review`).send({ quality: 5 });
    expect(r.status).toBe(200);
    expect(r.body.interval).toBeGreaterThan(1);
    expect(new Date(r.body.dueAt).getTime()).toBeGreaterThan(Date.now());
  });

  test('validation on generate', async () => {
    const r = await request(app()).post('/api/flashcards/generate').send({ deck: 'd' });
    expect(r.status).toBe(400);
  });
});
