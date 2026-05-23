#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";

const envText = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const client = await new MongoClient(process.env.MONGODB_URI).connect();
const docs = await client.db("handover").collection("suppliers").find({}, { projection: { _id: 0 } }).toArray();
console.log(JSON.stringify(docs, null, 2));
await client.close();
