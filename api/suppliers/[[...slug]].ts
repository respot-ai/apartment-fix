import { randomUUID } from "node:crypto";
import { getDb } from "../_lib/mongo.js";
import { supplierCreateSchema, supplierUpdateSchema } from "../_lib/validation.js";
import { badRequest, json, notFound, readJson } from "../_lib/http.js";

function segments(req: Request): string[] {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("suppliers");
  return idx === -1 ? [] : parts.slice(idx + 1).map(decodeURIComponent);
}

function deriveInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "";
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] ?? "") + (parts[1][0] ?? "");
  return cleaned.slice(0, 2);
}

export async function GET(req: Request): Promise<Response> {
  const parts = segments(req);
  const db = await getDb();

  if (parts.length === 0) {
    const docs = await db.collection("suppliers").find({}, { projection: { _id: 0 } }).toArray();
    return json(docs);
  }
  if (parts.length === 1) {
    const doc = await db.collection("suppliers").findOne({ id: parts[0] }, { projection: { _id: 0 } });
    return doc ? json(doc) : notFound();
  }
  return notFound();
}

export async function POST(req: Request): Promise<Response> {
  const parts = segments(req);
  if (parts.length !== 0) return notFound();

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

export async function PATCH(req: Request): Promise<Response> {
  const parts = segments(req);
  if (parts.length !== 1) return notFound();

  const body = await readJson(req);
  const parsed = supplierUpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error);

  const db = await getDb();
  const result = await db.collection("suppliers").findOneAndUpdate(
    { id: parts[0] },
    { $set: parsed.data },
    { returnDocument: "after", projection: { _id: 0 } },
  );
  return result ? json(result) : notFound();
}

export async function DELETE(req: Request): Promise<Response> {
  const parts = segments(req);
  if (parts.length !== 1) return notFound();
  const db = await getDb();
  const result = await db.collection("suppliers").deleteOne({ id: parts[0] });
  return result.deletedCount > 0 ? new Response(null, { status: 204 }) : notFound();
}
