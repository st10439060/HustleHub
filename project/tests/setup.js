/**
 * Jest test setup — connects to an in-memory or test MongoDB instance.
 * For Part 1 these tests use an in-memory MongoDB server (mongodb-memory-server)
 * so they run without an external database.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({ binary: { version: '7.0.3' } });
  const uri = mongoServer.getUri();
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}, 30000);

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});
