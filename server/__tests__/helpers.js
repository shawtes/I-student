// Minimal test helpers. We stub the Cognito auth middleware with a fake that
// reads x-test-user headers, so supertest can exercise routes without JWTs.

const express = require('express');

function fakeAuth(req, res, next) {
  const cognitoId = req.header('x-test-cognito');
  const email = req.header('x-test-email');
  const name = req.header('x-test-name') || 'Test';
  const role = req.header('x-test-role') || 'student';
  if (!cognitoId) return res.status(401).json({ message: 'No auth' });
  req.user = { cognitoId, email, name, role };
  next();
}

// Override the auth module with our stub before anything requires it.
// Jest module caching makes this stick for the test run.
function installFakeAuth() {
  jest.mock('../middleware/auth', () => (req, res, next) => fakeAuth(req, res, next));
  jest.mock('../middleware/rateLimiter', () => ({
    apiLimiter: (req, res, next) => next(),
    aiLimiter: (req, res, next) => next(),
  }));
}

function makeApp(routes) {
  const app = express();
  app.use(express.json());
  for (const [path, router] of Object.entries(routes)) {
    app.use(path, router);
  }
  return app;
}

function authHeaders(user) {
  return {
    'x-test-cognito': user.cognitoId,
    'x-test-email': user.email,
    'x-test-name': user.name || 'Test',
    'x-test-role': user.role || 'student',
  };
}

module.exports = { installFakeAuth, makeApp, authHeaders };
