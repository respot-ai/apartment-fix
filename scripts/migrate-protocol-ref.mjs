#!/usr/bin/env node
// Migrate the legacy defect.protocolRef free-text field into the structured
// defect.sources array. Each migrated defect gets a single source pointing at
// the contractor-handover protocol (matched by name, with a fallback to the
// first uploaded protocol) and the page number parsed out of the original
// string. Dry-run by default; pass --apply to write.

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

const client = await new MongoClient(uri).connect();
const db = client.db("handover");

const protocols = await db.collection("protocols").find({}, { projection: { _id: 0 } }).toArray();
if (protocols.length === 0) {
  console.error("no protocols uploaded — nothing to migrate against");
  await client.close();
  process.exit(1);
}

const handover = protocols.find((p) => /קבלן|handover/i.test(p.name)) ?? protocols[0];
console.log(`handover protocol: '${handover.name}' (${handover.id})`);

const candidates = await db
  .collection("defects")
  .find(
    {
      protocolRef: { $exists: true, $nin: [null, ""] },
      $or: [{ sources: { $exists: false } }, { sources: { $size: 0 } }],
    },
    { projection: { _id: 0, id: 1, shortId: 1, title: 1, protocolRef: 1 } },
  )
  .toArray();

console.log(`defects to migrate: ${candidates.length}`);

const plan = candidates.map((d) => {
  const match = String(d.protocolRef).match(/\d+/);
  const page = match ? Math.max(1, parseInt(match[0], 10)) : 1;
  return { id: d.id, shortId: d.shortId, title: d.title, raw: d.protocolRef, page };
});

for (const p of plan) {
  console.log(`  ${p.shortId ?? "—"}  page=${p.page}  raw='${p.raw}'  '${p.title}'`);
}

if (!apply) {
  console.log("\n(dry-run; pass --apply to write)");
  await client.close();
  process.exit(0);
}

for (const p of plan) {
  await db.collection("defects").updateOne(
    { id: p.id },
    { $set: { sources: [{ protocolId: handover.id, page: p.page }], protocolRef: "" } },
  );
}

console.log(`\nmigrated ${plan.length} defects → handover '${handover.name}'`);

await client.close();
