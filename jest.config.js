module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/server/__tests__/**/*.test.js', '**/tests/unit/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/client/', '/tests/e2e/'],
  testTimeout: 30000,
  verbose: true,
};
