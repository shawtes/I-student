// Shared setup for integration tests: spins up an in-memory Mongo and
// resets collections between tests. Tests opt in by calling useTestDb() at
// the top of their file.

const mongoose = require('mongoose');

function useTestDb() {
  let mongo;

  beforeAll(async () => {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
      for (const key of Object.keys(mongoose.connection.collections)) {
        await mongoose.connection.collections[key].deleteMany({});
      }
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  });
}

module.exports = { useTestDb };
