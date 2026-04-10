// TC-015: Grade Calculator (maps to Sprint 4 PDF Section 10.1)
// Note: the login flow uses Cognito, which can't run in a headless browser
// without real credentials. We navigate directly to /student/grades and stub
// the auth state in localStorage so the ProtectedRoute lets us through.

const { test, expect } = require('@playwright/test');

test.describe('Grade Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'user',
        JSON.stringify({ id: 'test-user', email: 'test@example.com', name: 'Test', role: 'student' })
      );
      window.localStorage.setItem('token', 'test-token');
    });
    await page.goto('/student/grades');
  });

  test('renders with default categories', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Grade Calculator' })).toBeVisible();
    await expect(page.getByLabel(/Category/).first()).toHaveValue('Assignments');
  });

  test('calculates a weighted grade', async ({ page }) => {
    // Default weights are 40 / 20 / 40
    await page.getByLabel('Score (%)').nth(0).fill('90');
    await page.getByLabel('Score (%)').nth(1).fill('80');
    await page.getByLabel('Score (%)').nth(2).fill('85');

    // 0.4*90 + 0.2*80 + 0.4*85 = 86.00
    const result = page.getByTestId('grade-result');
    await expect(result).toContainText('86.00%');
    await expect(result).toContainText('B');
  });

  test('rejects out-of-range score', async ({ page }) => {
    await page.getByLabel('Score (%)').nth(0).fill('150');
    await page.getByLabel('Score (%)').nth(0).blur();
    await expect(page.getByText('Score must be between 0 and 100')).toBeVisible();
  });

  test('can add and remove categories', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add category' }).click();
    await expect(page.getByLabel(/Category/)).toHaveCount(4);

    await page.getByRole('button', { name: /Remove/ }).first().click();
    await expect(page.getByLabel(/Category/)).toHaveCount(3);
  });

  test('reset restores defaults', async ({ page }) => {
    await page.getByLabel('Score (%)').nth(0).fill('50');
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.getByLabel('Score (%)').nth(0)).toHaveValue('');
  });
});
