import { randomUUID } from "node:crypto";
import { getDb } from "../_lib/mongo.js";
import { supplierCreateSchema } from "../_lib/validation.js";
import { badRequest, json, readJson } from "../_lib/http.js";

function deriveInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "";
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] ?? "") + (parts[1][0] ?? "");
  return cleaned.slice(0, 2);
}

export async function GET(): Promise<Response> {
  const db = await getDb();
  const docs = await db.collection("suppliers").find({}, { projection: { _id: 0 } }).toArray();
  return json(docs);
}

export async function POST(req: Request): Promise<Response> {
  const body = await readJson(req);
  const parsed = supplierCreateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error);

  const doc = {
    id: randomUUID(),
    ...parsed.data,
    initials: parsed.data.initials || deriveInitials(parsed.data.name),
  };
  const db = await getDb();
  await db.collection("suppliers").insertOne(doc);
  const { _id: _omit, ...returned } = doc as typeof doc & { _id?: unknown };
  return json(returned, { status: 201 });
}
