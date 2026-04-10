const { test, expect } = require('@playwright/test');
const { stubLogin } = require('./_auth');

test.describe('Help Desk (TC-013)', () => {
  let tickets = [];

  test.beforeEach(async ({ page }) => {
    tickets = [];
    await stubLogin(page);
    await page.route('**/api/tickets', route => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(tickets),
        });
      }
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        const t = { _id: 'id-' + tickets.length, status: 'open', ...body };
        tickets.push(t);
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(t) });
      }
      route.continue();
    });
    await page.goto('/student/help');
  });

  test('submits a ticket and shows it in the list', async ({ page }) => {
    await page.getByLabel('Category').selectOption('technical');
    await page.getByLabel('Describe the problem').fill('I need help pls!!!');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByText('Ticket submitted')).toBeVisible();
    await expect(page.getByText('I need help pls!!!')).toBeVisible();
  });
});
