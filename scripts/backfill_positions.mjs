#!/usr/bin/env node
// Assign a sequential `position` to defects that don't have one. Existing
// positions are preserved; new ones are appended after `max(position)`,
// ordered by the same comparator the UI uses (priority then dueDate).
// Dry-run by default; pass --apply to write.

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

const priorityRank = { critical: 0, high: 1, medium: 2, low: 3 };

const client = await new MongoClient(uri).connect();
const db = client.db("handover");
const col = db.collection("defects");

const all = await col
  .find({}, { projection: { _id: 0, id: 1, shortId: 1, title: 1, priority: 1, dueDate: 1, position: 1 } })
  .toArray();

const existing = all.filter((d) => typeof d.position === "number");
const missing = all.filter((d) => typeof d.position !== "number");
const currentMax = existing.reduce((m, d) => Math.max(m, d.position), 0);

console.log(`defects total: ${all.length}`);
console.log(`with position: ${existing.length} (max ${currentMax})`);
console.log(`missing position: ${missing.length}`);

missing.sort(
  (a, b) =>
    (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99) ||
    (a.dueDate || "￿").localeCompare(b.dueDate || "￿"),
);

const assignments = missing.map((d, i) => ({
  id: d.id,
  shortId: d.shortId,
  title: d.title,
  priority: d.priority,
  position: currentMax + 1 + i,
}));

for (const a of assignments) {
  console.log(`  pos=${a.position}  ${a.shortId ?? "—"}  [${a.priority}]  ${a.title}`);
}

if (!apply) {
  console.log("\n(dry-run; pass --apply to write)");
  await client.close();
  process.exit(0);
}

if (assignments.length === 0) {
  console.log("\nnothing to do");
  await client.close();
  process.exit(0);
}

const ops = assignments.map((a) => ({
  updateOne: { filter: { id: a.id }, update: { $set: { position: a.position } } },
}));
const result = await col.bulkWrite(ops);
console.log(`\nassigned position to ${result.modifiedCount} defects`);

await client.close();
