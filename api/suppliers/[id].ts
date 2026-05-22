import { getDb } from "../_lib/mongo.js";
import { supplierUpdateSchema } from "../_lib/validation.js";
import { badRequest, json, notFound, readJson } from "../_lib/http.js";

function extractId(req: Request): string | null {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("suppliers");
  if (idx === -1 || idx + 1 >= parts.length) return null;
  return decodeURIComponent(parts[idx + 1]);
}

export async function GET(req: Request): Promise<Response> {
  const id = extractId(req);
  if (!id) return notFound();
  const db = await getDb();
  const doc = await db.collection("suppliers").findOne({ id }, { projection: { _id: 0 } });
  return doc ? json(doc) : notFound();
}

export async function PATCH(req: Request): Promise<Response> {
  const id = extractId(req);
  if (!id) return notFound();

  const body = await readJson(req);
  const parsed = supplierUpdateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error);

  const db = await getDb();
  const result = await db.collection("suppliers").findOneAndUpdate(
    { id },
    { $set: parsed.data },
    { returnDocument: "after", projection: { _id: 0 } },
  );
  return result ? json(result) : notFound();
}

export async function DELETE(req: Request): Promise<Response> {
  const id = extractId(req);
  if (!id) return notFound();
  const db = await getDb();
  const result = await db.collection("suppliers").deleteOne({ id });
  return result.deletedCount > 0 ? new Response(null, { status: 204 }) : notFound();
}
