import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongo;

export async function startInMemoryMongo() {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri, { autoIndex: true });
  return uri;
}

export async function stopInMemoryMongo() {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
  mongo = null;
}

export async function resetDb() {
  const collections = await mongoose.connection.db.collections();
  for (const c of collections) {
    await c.deleteMany({});
  }
}

