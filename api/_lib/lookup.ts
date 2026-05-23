import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDb } from "./mongo.js";
import { badRequest, json, notFound, readJson } from "./http.js";

export type LookupDoc = { id: string; name: string };

export const lookupCreateSchema = z.object({ name: z.string().min(1).max(80) });

type SeedSpec = string | { id: string; name: string };

export function makeLookupHandlers(collectionName: string, defaults: SeedSpec[]) {
  async function ensureSeeded(): Promise<void> {
    const db = await getDb();
    const collection = db.collection<LookupDoc>(collectionName);
    const count = await collection.estimatedDocumentCount();
    if (count > 0) return;
    await collection.insertMany(
      defaults.map((seed) => (typeof seed === "string" ? { id: randomUUID(), name: seed } : seed)),
    );
  }

  function extractId(req: Request): string | null {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf(collectionName);
    if (idx === -1 || idx + 1 >= parts.length) return null;
    return decodeURIComponent(parts[idx + 1]);
  }

  return {
    async list(): Promise<Response> {
      await ensureSeeded();
      const db = await getDb();
      const docs = await db
        .collection<LookupDoc>(collectionName)
        .find({}, { projection: { _id: 0 } })
        .sort({ name: 1 })
        .toArray();
      return json(docs);
    },

    async create(req: Request): Promise<Response> {
      const body = await readJson(req);
      const parsed = lookupCreateSchema.safeParse(body);
      if (!parsed.success) return badRequest(parsed.error);
      const doc: LookupDoc = { id: randomUUID(), name: parsed.data.name.trim() };
      const db = await getDb();
      await db.collection<LookupDoc>(collectionName).insertOne(doc);
      return json(doc, { status: 201 });
    },

    async remove(req: Request): Promise<Response> {
      const id = extractId(req);
      if (!id) return notFound();
      const db = await getDb();
      const result = await db.collection<LookupDoc>(collectionName).deleteOne({ id });
      return result.deletedCount > 0 ? new Response(null, { status: 204 }) : notFound();
    },
  };
}
