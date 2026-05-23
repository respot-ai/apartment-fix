#!/usr/bin/env node
// Seed real suppliers in MongoDB and remove the smoke-test supplier.
// Dry-run by default; pass --apply to actually write.

import { randomUUID } from "node:crypto";
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

const suppliers = [
  { name: "אבידס", domain: "מערכות אינטרקום, מערכות תקשורת ו-TV", phone: "08-9519702", email: "iyadbiedas@gmail.com" },
  { name: "ברק אש", domain: "גילוי אש", phone: "03-5581246", email: "barkesh@barkesh.com" },
  { name: "מזמ", domain: "דלת ממד, חלון ממד פנימי", phone: "03-9502666", email: "mazam@netvision.net.il" },
  { name: "נגב", domain: "קרמיקה, כלים סניטרים, אמבטיה, ארונות אמבטיה, ברזים", phone: "*2855", email: "cs-negev@negev-group.co.il" },
  { name: "MODY", domain: "קרמיקה, כלים סניטרים, אמבטיה, ארונות אמבטיה, ברזים", phone: "09-8360043", email: "" },
  { name: "פאנת", domain: "אלומיניום מלוקות ווטרינות", phone: "08-6274852", email: "ptpant@gmail.com" },
  { name: "אור הטבע", domain: "מערכת סולארית דוד חשמלי", phone: "03-5564444 / 1-800-556-444", email: "info@idealspar.co.il" },
  { name: "רשפים", domain: "דלת כניסה", phone: "08-9741017", email: "arielc@reshafimdoors.co.il" },
  { name: "תיבת נח", domain: "מערכת מיזוג אוויר בממד", phone: "04-6299988", email: "www.beind.co.il" },
  { name: "תמנון הופ", domain: "אלומיניום במחסן כניסה, מנהל כניסה", phone: "03-5586406", email: "info@tamnun-hop.co.il" },
  { name: "דלתות חמדיה", domain: "דלתות פנים", phone: "09-7401654", email: "sheruthamadia@h-doors.com" },
  { name: "אביבי מטבחים", domain: "מטבח", phone: "03-6161054", email: "project@avivi.com" },
  { name: "סמל מטבחים", domain: "מטבח", phone: "08-9396316", email: "michaela@semel-kitchens.com" },
  { name: "וגאייר", domain: "מזגנים", phone: "039049393", email: "office@vega-air.co.il" },
  { name: "שיש ליאן", domain: "שיש למטבח", phone: "03-5795790", email: "showroom@evenlian.com" },
  { name: "שיש גטניו", domain: "שיש למטבח", phone: "03-3733100", email: "info@gatenio.co.il" },
];

function deriveInitials(name) {
  const cleaned = name.trim();
  if (!cleaned) return "";
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] ?? "") + (parts[1][0] ?? "");
  return cleaned.slice(0, 2);
}

const client = await new MongoClient(uri).connect();
const db = client.db("handover");
const col = db.collection("suppliers");

const existing = await col.find({}, { projection: { _id: 0 } }).toArray();
const existingByName = new Map(existing.map((s) => [s.name, s]));

console.log(`existing suppliers: ${existing.length}`);

const smokeTest = existing.find(
  (s) =>
    (s.name ?? "").toLowerCase().includes("smoke") ||
    (s.email ?? "").toLowerCase().includes("smoke") ||
    (s.name ?? "").toLowerCase() === "test",
);
if (smokeTest) {
  console.log(`smoke-test supplier to delete: ${smokeTest.id} — name="${smokeTest.name}" email="${smokeTest.email}"`);
} else {
  console.log("no smoke-test supplier found");
}

const toAdd = suppliers.filter((s) => !existingByName.has(s.name));
const skipped = suppliers.filter((s) => existingByName.has(s.name));

console.log(`\nto add: ${toAdd.length}`);
for (const s of toAdd) console.log(`  + ${s.name} — ${s.domain} — ${s.phone} — ${s.email}`);
if (skipped.length) {
  console.log(`\nalready present (skip): ${skipped.length}`);
  for (const s of skipped) console.log(`  = ${s.name}`);
}

if (!apply) {
  console.log("\n(dry-run; pass --apply to write)");
  await client.close();
  process.exit(0);
}

if (smokeTest) {
  const res = await col.deleteOne({ id: smokeTest.id });
  console.log(`deleted ${smokeTest.name} (deletedCount=${res.deletedCount})`);
}

if (toAdd.length > 0) {
  const docs = toAdd.map((s) => ({
    id: randomUUID(),
    name: s.name,
    domain: s.domain,
    phone: s.phone,
    email: s.email,
    initials: deriveInitials(s.name),
  }));
  const res = await col.insertMany(docs);
  console.log(`inserted ${res.insertedCount}`);
}

await client.close();
