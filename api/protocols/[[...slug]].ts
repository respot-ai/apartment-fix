import { randomUUID } from "node:crypto";
import { del } from "@vercel/blob";
import { getDb } from "../_lib/mongo.js";
import { protocolCreateSchema } from "../_lib/validation.js";
import { badRequest, json, notFound, readJson } from "../_lib/http.js";

function segments(req: Request): string[] {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("protocols");
  return idx === -1 ? [] : parts.slice(idx + 1).map(decodeURIComponent);
}

export async function GET(req: Request): Promise<Response> {
  const parts = segments(req);
  const db = await getDb();

  if (parts.length === 0) {
    const docs = await db
      .collection("protocols")
      .find({}, { projection: { _id: 0 } })
      .sort({ uploadedAt: -1 })
      .toArray();
    return json(docs);
  }
  if (parts.length === 1) {
    const doc = await db.collection("protocols").findOne({ id: parts[0] }, { projection: { _id: 0 } });
    return doc ? json(doc) : notFound();
  }
  return notFound();
}

export async function POST(req: Request): Promise<Response> {
  const parts = segments(req);
  if (parts.length !== 0) return notFound();

  const body = await readJson(req);
  const parsed = protocolCreateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error);

  const db = await getDb();
  const doc = {
    id: randomUUID(),
    uploadedAt: new Date().toISOString(),
    ...parsed.data,
  };
  await db.collection("protocols").insertOne(doc);
  const { _id: _omit, ...returned } = doc as typeof doc & { _id?: unknown };
  return json(returned, { status: 201 });
}

export async function DELETE(req: Request): Promise<Response> {
  const parts = segments(req);
  if (parts.length !== 1) return notFound();

  const db = await getDb();
  const doc = await db.collection("protocols").findOne({ id: parts[0] }, { projection: { _id: 0 } });
  if (!doc) return notFound();
  try {
    await del(doc.url as string);
  } catch (err) {
    console.warn("blob del failed", err);
  }
  await db.collection("protocols").deleteOne({ id: parts[0] });
  return new Response(null, { status: 204 });
}
