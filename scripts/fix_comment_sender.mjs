#!/usr/bin/env node
// Merge each comment's "who" into the start of its "text", because the inspector
// name was originally part of the comment in the source PDF. Run with `--apply`
// to write changes; default is dry-run.

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
const defects = db.collection("defects");

const cursor = defects.find({ "comments.0": { $exists: true } }, { projection: { id: 1, comments: 1 } });
let scanned = 0;
let changed = 0;
let commentsTouched = 0;

while (await cursor.hasNext()) {
  const doc = await cursor.next();
  scanned++;
  let dirty = false;
  const next = doc.comments.map((c) => {
    const who = (c.who ?? "").trim();
    const text = (c.text ?? "").trim();
    if (!who) return c;
    if (text.startsWith(who)) {
      if (c.who === "" && c.initials === "") return c;
      dirty = true;
      commentsTouched++;
      return { ...c, who: "", initials: "" };
    }
    dirty = true;
    commentsTouched++;
    const merged = text ? `${who}: ${text}` : who;
    return { ...c, text: merged, who: "", initials: "" };
  });
  if (dirty) {
    changed++;
    console.log(`defect ${doc.id} — ${doc.comments.length} comment(s) updated`);
    for (let i = 0; i < doc.comments.length; i++) {
      const before = doc.comments[i];
      const after = next[i];
      if (before.text !== after.text || before.who !== after.who) {
        console.log(`  [${before.who} | ${before.text}] -> [${after.text}]`);
      }
    }
    if (apply) {
      await defects.updateOne({ id: doc.id }, { $set: { comments: next } });
    }
  }
}

console.log(`\nscanned=${scanned} defectsChanged=${changed} commentsTouched=${commentsTouched} ${apply ? "(applied)" : "(dry-run; pass --apply to write)"}`);

await client.close();
