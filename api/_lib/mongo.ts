import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not set");
}

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

const clientPromise =
  globalThis.__mongoClientPromise ??
  (globalThis.__mongoClientPromise = new MongoClient(uri).connect());

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db("handover");
}
