#!/usr/bin/env node
// Backfill defect.shortId for any defects missing one.
// Ensures a unique sparse index on shortId, then assigns 5-char A-Z+digit
// codes (excluding O/0/I/1) with retry on collision.
// Dry-run by default; pass --apply to write.

import { randomInt } from "node:crypto";
import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";

const envText = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const apply = process.argv.includes("--apply");
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not set");

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LENGTH = 5;

function generate() {
  let out = "";
  for (let i = 0; i < LENGTH; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

const client = await new MongoClient(uri).connect();
const db = client.db("handover");
const col = db.collection("defects");

if (apply) {
  await col.createIndex({ shortId: 1 }, { unique: true, sparse: true });
  console.log("ensured unique sparse index on shortId");
}

const taken = new Set(
  (await col.find({ shortId: { $exists: true } }, { projection: { shortId: 1 } }).toArray())
    .map((d) => d.shortId)
    .filter(Boolean),
);
console.log(`existing shortIds: ${taken.size}`);

const missing = await col
  .find({ shortId: { $exists: false } }, { projection: { id: 1, title: 1 } })
  .toArray();
console.log(`defects missing shortId: ${missing.length}`);

const assignments = [];
for (const d of missing) {
  let candidate;
  for (let attempt = 0; attempt < 16; attempt++) {
    candidate = generate();
    if (!taken.has(candidate)) break;
    candidate = null;
  }
  if (!candidate) throw new Error(`could not generate unique shortId for ${d.id}`);
  taken.add(candidate);
  assignments.push({ id: d.id, title: d.title, shortId: candidate });
}

for (const a of assignments) console.log(`  ${a.shortId}  ${a.id}  ${a.title}`);

if (!apply) {
  console.log("\n(dry-run; pass --apply to write)");
  await client.close();
  process.exit(0);
}

for (const a of assignments) {
  await col.updateOne({ id: a.id }, { $set: { shortId: a.shortId } });
}
console.log(`\nassigned shortId to ${assignments.length} defects`);

await client.close();
