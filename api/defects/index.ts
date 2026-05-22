import { randomUUID } from "node:crypto";
import { getDb } from "../_lib/mongo.js";
import { defectCreateSchema } from "../_lib/validation.js";
import { badRequest, json, readJson } from "../_lib/http.js";

export async function GET(): Promise<Response> {
  const db = await getDb();
  const docs = await db.collection("defects").find({}, { projection: { _id: 0 } }).toArray();
  return json(docs);
}

export async function POST(req: Request): Promise<Response> {
  const body = await readJson(req);
  const parsed = defectCreateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error);

  const doc = {
    id: randomUUID(),
    reportedAt: parsed.data.reportedAt ?? new Date().toISOString().slice(0, 10),
    comments: [],
    activity: [],
    ...parsed.data,
  };
  const db = await getDb();
  await db.collection("defects").insertOne(doc);
  const { _id: _omit, ...returned } = doc as typeof doc & { _id?: unknown };
  return json(returned, { status: 201 });
}
