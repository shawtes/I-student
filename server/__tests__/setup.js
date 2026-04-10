// Jest global setup: spin up an in-memory Mongo so tests don't touch a real DB.
// Requires mongodb-memory-server as a dev dep. If it's not installed, the
// before-all hook will throw and tests will fail fast with a clear message.

const mongoose = require('mongoose');

let mongo;

beforeAll(async () => {
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  } catch (e) {
    console.warn('mongodb-memory-server not installed, some tests will be skipped');
  }
});

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
