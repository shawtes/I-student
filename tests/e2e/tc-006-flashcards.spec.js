const { test, expect } = require('@playwright/test');
const { stubLogin } = require('./_auth');

test.describe('Flashcards (TC-006)', () => {
  let decks = [];
  let cards = [];

  test.beforeEach(async ({ page }) => {
    decks = [];
    cards = [];
    await stubLogin(page);

    await page.route('**/api/flashcards/decks', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(decks) });
    });
    await page.route('**/api/flashcards/generate', route => {
      const { deck, count } = route.request().postDataJSON();
      cards = Array.from({ length: count || 3 }, (_, i) => ({
        _id: 'c' + i,
        deck,
        question: 'Q' + (i + 1),
        answer: 'A' + (i + 1),
        source: 'ai',
      }));
      if (!decks.find(d => d.deck === deck)) decks.push({ deck, count: cards.length, due: 0 });
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(cards) });
    });
    await page.route('**/api/flashcards?deck=*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cards) });
    });

    await page.goto('/student/flashcards');
  });

  test('generates a deck from text', async ({ page }) => {
    await page.getByLabel('Deck name').fill('Chapter 5');
    await page.getByLabel(/Paste notes/).fill('The cell is the smallest unit of life. Mitochondria generate ATP. Ribosomes make proteins.');
    await page.getByRole('button', { name: 'Generate cards' }).click();

    await expect(page.getByText('Flashcards generated')).toBeVisible();
    await expect(page.getByText('Q1')).toBeVisible();
  });
});
