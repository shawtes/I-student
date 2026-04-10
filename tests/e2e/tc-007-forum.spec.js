const { test, expect } = require('@playwright/test');
const { stubLogin } = require('./_auth');

test.describe('Forum (TC-007)', () => {
  let posts = [];

  test.beforeEach(async ({ page }) => {
    posts = [];
    await stubLogin(page);
    await page.route('**/api/forum*', route => {
      const url = route.request().url();
      const method = route.request().method();
      if (method === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(posts) });
      }
      if (method === 'POST' && /\/replies$/.test(url)) {
        const body = route.request().postDataJSON();
        const id = url.match(/forum\/([^/]+)\/replies/)[1];
        const post = posts.find(p => p._id === id);
        post.replies.push({ author: { name: 'Test' }, body: body.body, createdAt: new Date().toISOString() });
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(post) });
      }
      if (method === 'POST') {
        const body = route.request().postDataJSON();
        const post = {
          _id: 'p' + posts.length,
          author: { name: 'Test' },
          replies: [],
          createdAt: new Date().toISOString(),
          ...body,
        };
        posts.push(post);
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(post) });
      }
      route.continue();
    });
    await page.goto('/student/forum');
  });

  test('creates a post and renders it', async ({ page }) => {
    await page.getByLabel('Title').fill('abcxyz');
    await page.getByLabel('Body').fill('post body');
    await page.getByRole('button', { name: 'Post' }).click();
    await expect(page.getByRole('heading', { name: 'abcxyz' })).toBeVisible();
  });

  test('adds a reply to an existing post', async ({ page }) => {
    await page.getByLabel('Title').fill('parent post');
    await page.getByLabel('Body').fill('parent body');
    await page.getByRole('button', { name: 'Post' }).click();

    await page.getByPlaceholder('Write a reply...').fill('first reply');
    await page.getByRole('button', { name: 'Reply' }).click();
    await expect(page.getByText('first reply')).toBeVisible();
  });
});
