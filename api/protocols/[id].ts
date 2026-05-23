import { del } from "@vercel/blob";
import { getDb } from "../_lib/mongo.js";
import { json, notFound } from "../_lib/http.js";

function extractId(req: Request): string | null {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("protocols");
  if (idx === -1 || idx + 1 >= parts.length) return null;
  return decodeURIComponent(parts[idx + 1]);
}

export async function DELETE(req: Request): Promise<Response> {
  const id = extractId(req);
  if (!id) return notFound();
  const db = await getDb();
  const doc = await db.collection("protocols").findOne({ id }, { projection: { _id: 0 } });
  if (!doc) return notFound();
  try {
    await del(doc.url as string);
  } catch (err) {
    // Best-effort: continue removing the DB record even if blob delete fails.
    console.warn("blob del failed", err);
  }
  await db.collection("protocols").deleteOne({ id });
  return new Response(null, { status: 204 });
}

export async function GET(req: Request): Promise<Response> {
  const id = extractId(req);
  if (!id) return notFound();
  const db = await getDb();
  const doc = await db.collection("protocols").findOne({ id }, { projection: { _id: 0 } });
  return doc ? json(doc) : notFound();
}
