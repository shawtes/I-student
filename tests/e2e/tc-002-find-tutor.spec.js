const { test, expect } = require('@playwright/test');
const { stubLogin } = require('./_auth');

test.describe('Find a Tutor (TC-002)', () => {
  test.beforeEach(async ({ page }) => {
    await stubLogin(page);
    await page.route('**/api/tutors/search*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { _id: 't1', name: 'Tina Tutor', subjects: ['Math'], hourlyRate: 30, ratingAverage: 4.8, ratingCount: 12 }
        ])
      });
    });
    await page.goto('/student/find-tutor');
  });

  test('renders the search form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Find a Tutor' })).toBeVisible();
    await expect(page.getByLabel('Subject')).toBeVisible();
  });

  test('searching shows a tutor card', async ({ page }) => {
    await page.getByLabel('Subject').fill('Math');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByRole('heading', { name: 'Tina Tutor' })).toBeVisible();
    await expect(page.getByText('$30/hr')).toBeVisible();
  });

  test('no results message', async ({ page }) => {
    await page.route('**/api/tutors/search*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.getByLabel('Subject').fill('Underwater Basket');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText('No tutors matched')).toBeVisible();
  });
});
