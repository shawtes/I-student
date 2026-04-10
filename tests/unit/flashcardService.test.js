// Flashcard service naive-fallback tests. We make sure that when no API key
// is present the service still returns something reasonable so devs don't need
// Stripe/OpenAI set up to run the test suite.

const origKey = process.env.OPENAI_API_KEY;

beforeEach(() => {
  delete process.env.OPENAI_API_KEY;
  jest.resetModules();
});

afterAll(() => {
  if (origKey !== undefined) process.env.OPENAI_API_KEY = origKey;
});

describe('flashcardService fallback', () => {
  test('returns up to count cards', async () => {
    const svc = require('../../server/services/flashcardService');
    const cards = await svc.generate({
      text: 'The cell is the unit of life. Mitochondria produce ATP. DNA stores genetic info.',
      count: 2
    });
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveProperty('question');
    expect(cards[0]).toHaveProperty('answer');
  });

  test('returns empty array when text has no usable sentences', async () => {
    const svc = require('../../server/services/flashcardService');
    const cards = await svc.generate({ text: 'short', count: 5 });
    expect(cards).toHaveLength(0);
  });

  test('respects count', async () => {
    const svc = require('../../server/services/flashcardService');
    const cards = await svc.generate({
      text: 'Sentence one is long enough. Sentence two is also here. Three is here too.',
      count: 1
    });
    expect(cards).toHaveLength(1);
  });
});
