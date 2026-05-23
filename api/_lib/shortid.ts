import { randomInt } from "node:crypto";
import type { Db } from "mongodb";

// Unambiguous uppercase + digits (no O/0, I/1).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LENGTH = 5;

export function generateShortId(): string {
  let out = "";
  for (let i = 0; i < LENGTH; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

let indexEnsured = false;

async function ensureIndex(db: Db): Promise<void> {
  if (indexEnsured) return;
  await db.collection("defects").createIndex({ shortId: 1 }, { unique: true, sparse: true });
  indexEnsured = true;
}

export async function generateUniqueShortId(db: Db): Promise<string> {
  await ensureIndex(db);
  const collection = db.collection("defects");
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = generateShortId();
    const existing = await collection.findOne({ shortId: candidate }, { projection: { _id: 1 } });
    if (!existing) return candidate;
  }
  throw new Error("could not generate a unique shortId after 8 attempts");
}
