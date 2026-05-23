import { randomUUID } from "node:crypto";
import { getDb } from "../_lib/mongo.js";
import { protocolCreateSchema } from "../_lib/validation.js";
import { badRequest, json, readJson } from "../_lib/http.js";

export async function GET(): Promise<Response> {
  const db = await getDb();
  const docs = await db
    .collection("protocols")
    .find({}, { projection: { _id: 0 } })
    .sort({ uploadedAt: -1 })
    .toArray();
  return json(docs);
}

export async function POST(req: Request): Promise<Response> {
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
