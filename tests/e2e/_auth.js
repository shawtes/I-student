// Helper: stubs the student auth state in localStorage so Playwright can get
// past ProtectedRoute without driving the real Cognito flow. Keeps specs short.

async function stubLogin(page, role = 'student') {
  await page.addInitScript((r) => {
    window.localStorage.setItem('user', JSON.stringify({
      id: 'test-user',
      email: 'test@example.com',
      name: 'Test User',
      role: r,
    }));
    window.localStorage.setItem('token', 'test-token');
  }, role);
}

module.exports = { stubLogin };
