import { randomUUID } from "node:crypto";
import { z } from "zod";
import { del } from "@vercel/blob";
import { getDb } from "./_lib/mongo.js";
import {
  commentCreateSchema,
  defectCreateSchema,
  defectUpdateSchema,
  protocolCreateSchema,
  supplierCreateSchema,
  supplierUpdateSchema,
} from "./_lib/validation.js";
import { badRequest, json, notFound, readJson } from "./_lib/http.js";
import { generateUniqueShortId } from "./_lib/shortid.js";
import { makeLookupHandlers } from "./_lib/lookup.js";
import { defaultRooms, defaultTrades } from "./_lib/seeds.js";

const commentPatchSchema = z.object({ text: z.string().min(1) });
const reorderSchema = z.object({
  updates: z
    .array(z.object({ id: z.string().min(1), position: z.number().int().nonnegative() }))
    .min(1)
    .max(500),
});

async function nextPosition(db: Awaited<ReturnType<typeof getDb>>): Promise<number> {
  const last = await db
    .collection("defects")
    .find({ position: { $exists: true } }, { projection: { position: 1 } })
    .sort({ position: -1 })
    .limit(1)
    .next();
  const current = typeof last?.position === "number" ? last.position : 0;
  return current + 1;
}

const roomsHandlers = makeLookupHandlers("rooms", defaultRooms);
const tradesHandlers = makeLookupHandlers("trades", defaultTrades);

function segments(req: Request): string[] {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("api");
  const after = idx === -1 ? parts : parts.slice(idx + 1);
  return after.map(decodeURIComponent);
}

function deriveInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "";
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] ?? "") + (parts[1][0] ?? "");
  return cleaned.slice(0, 2);
}

async function handleDefects(req: Request, rest: string[]): Promise<Response> {
  const db = await getDb();

  if (req.method === "GET") {
    if (rest.length === 0) {
      const docs = await db.collection("defects").find({}, { projection: { _id: 0 } }).toArray();
      return json(docs);
    }
    if (rest.length === 1) {
      const doc = await db.collection("defects").findOne({ id: rest[0] }, { projection: { _id: 0 } });
      return doc ? json(doc) : notFound();
    }
    return notFound();
  }

  if (req.method === "POST") {
    if (rest.length === 1 && rest[0] === "reorder") {
      const body = await readJson(req);
      const parsed = reorderSchema.safeParse(body);
      if (!parsed.success) return badRequest(parsed.error);
      const ops = parsed.data.updates.map((u) => ({
        updateOne: {
          filter: { id: u.id },
          update: { $set: { position: u.position } },
        },
      }));
      const result = await db.collection("defects").bulkWrite(ops);
      return json({ ok: true, modified: result.modifiedCount });
    }
    if (rest.length === 0) {
      const body = await readJson(req);
      const parsed = defectCreateSchema.safeParse(body);
      if (!parsed.success) return badRequest(parsed.error);
      const position = parsed.data.position ?? (await nextPosition(db));
      const doc = {
        id: randomUUID(),
        shortId: await generateUniqueShortId(db),
        reportedAt: parsed.data.reportedAt ?? new Date().toISOString().slice(0, 10),
        comments: [],
        activity: [],
        ...parsed.data,
        position,
      };
      await db.collection("defects").insertOne(doc);
      const { _id: _omit, ...returned } = doc as typeof doc & { _id?: unknown };
      return json(returned, { status: 201 });
    }
    if (rest.length === 2 && rest[1] === "comments") {
      const body = await readJson(req);
      const parsed = commentCreateSchema.safeParse(body);
      if (!parsed.success) return badRequest(parsed.error);
      const comment = {
        id: randomUUID(),
        at: parsed.data.at ?? new Date().toISOString(),
        ...parsed.data,
      };
      const result = await db.collection("defects").findOneAndUpdate(
        { id: rest[0] },
        {
          $push: {
            comments: comment,
            activity: {
              id: randomUUID(),
              who: comment.who,
              initials: comment.initials,
              text: "הוסיף תגובה",
              at: comment.at,
            },
          } as never,
        },
        { returnDocument: "after", projection: { _id: 0 } },
      );
      return result ? json(result, { status: 201 }) : notFound();
    }
    return notFound();
  }

  if (req.method === "PATCH") {
    if (rest.length === 1) {
      const body = await readJson(req);
      const parsed = defectUpdateSchema.safeParse(body);
      if (!parsed.success) return badRequest(parsed.error);
      const patch: Record<string, unknown> = { ...parsed.data };
      if (parsed.data.priority !== undefined) {
        const existing = await db
          .collection("defects")
          .findOne({ id: rest[0] }, { projection: { _id: 0, priority: 1 } });
        if (existing && existing.priority !== parsed.data.priority) {
          patch.position = await nextPosition(db);
        }
      }
      const result = await db.collection("defects").findOneAndUpdate(
        { id: rest[0] },
        { $set: patch },
        { returnDocument: "after", projection: { _id: 0 } },
      );
      return result ? json(result) : notFound();
    }
    if (rest.length === 3 && rest[1] === "comments") {
      const body = await readJson(req);
      const parsed = commentPatchSchema.safeParse(body);
      if (!parsed.success) return badRequest(parsed.error);
      const result = await db.collection("defects").findOneAndUpdate(
        { id: rest[0], "comments.id": rest[2] },
        { $set: { "comments.$.text": parsed.data.text } },
        { returnDocument: "after", projection: { _id: 0 } },
      );
      return result ? json(result) : notFound();
    }
    return notFound();
  }

  if (req.method === "DELETE") {
    if (rest.length === 1) {
      const result = await db.collection("defects").deleteOne({ id: rest[0] });
      return result.deletedCount > 0 ? new Response(null, { status: 204 }) : notFound();
    }
    if (rest.length === 3 && rest[1] === "comments") {
      const result = await db.collection("defects").findOneAndUpdate(
        { id: rest[0] },
        { $pull: { comments: { id: rest[2] } } as never },
        { returnDocument: "after", projection: { _id: 0 } },
      );
      return result ? json(result) : notFound();
    }
    return notFound();
  }

  return new Response(null, { status: 405 });
}

async function handleSuppliers(req: Request, rest: string[]): Promise<Response> {
  const db = await getDb();

  if (req.method === "GET") {
    if (rest.length === 0) {
      const docs = await db.collection("suppliers").find({}, { projection: { _id: 0 } }).toArray();
      return json(docs);
    }
    if (rest.length === 1) {
      const doc = await db.collection("suppliers").findOne({ id: rest[0] }, { projection: { _id: 0 } });
      return doc ? json(doc) : notFound();
    }
    return notFound();
  }

  if (req.method === "POST") {
    if (rest.length !== 0) return notFound();
    const body = await readJson(req);
    const parsed = supplierCreateSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error);
    const doc = {
      id: randomUUID(),
      ...parsed.data,
      initials: parsed.data.initials || deriveInitials(parsed.data.name),
    };
    await db.collection("suppliers").insertOne(doc);
    const { _id: _omit, ...returned } = doc as typeof doc & { _id?: unknown };
    return json(returned, { status: 201 });
  }

  if (req.method === "PATCH") {
    if (rest.length !== 1) return notFound();
    const body = await readJson(req);
    const parsed = supplierUpdateSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error);
    const result = await db.collection("suppliers").findOneAndUpdate(
      { id: rest[0] },
      { $set: parsed.data },
      { returnDocument: "after", projection: { _id: 0 } },
    );
    return result ? json(result) : notFound();
  }

  if (req.method === "DELETE") {
    if (rest.length !== 1) return notFound();
    const result = await db.collection("suppliers").deleteOne({ id: rest[0] });
    return result.deletedCount > 0 ? new Response(null, { status: 204 }) : notFound();
  }

  return new Response(null, { status: 405 });
}

async function handleLookup(
  handlers: ReturnType<typeof makeLookupHandlers>,
  req: Request,
  rest: string[],
): Promise<Response> {
  if (req.method === "GET") return rest.length === 0 ? handlers.list() : notFound();
  if (req.method === "POST") return rest.length === 0 ? handlers.create(req) : notFound();
  if (req.method === "DELETE") return rest.length === 1 ? handlers.remove(req) : notFound();
  return new Response(null, { status: 405 });
}

async function handleProtocols(req: Request, rest: string[]): Promise<Response> {
  const db = await getDb();

  if (req.method === "GET") {
    if (rest.length === 0) {
      const docs = await db
        .collection("protocols")
        .find({}, { projection: { _id: 0 } })
        .sort({ uploadedAt: -1 })
        .toArray();
      return json(docs);
    }
    if (rest.length === 1) {
      const doc = await db.collection("protocols").findOne({ id: rest[0] }, { projection: { _id: 0 } });
      return doc ? json(doc) : notFound();
    }
    return notFound();
  }

  if (req.method === "POST") {
    if (rest.length !== 0) return notFound();
    const body = await readJson(req);
    const parsed = protocolCreateSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error);
    const doc = {
      id: randomUUID(),
      uploadedAt: new Date().toISOString(),
      ...parsed.data,
    };
    await db.collection("protocols").insertOne(doc);
    const { _id: _omit, ...returned } = doc as typeof doc & { _id?: unknown };
    return json(returned, { status: 201 });
  }

  if (req.method === "DELETE") {
    if (rest.length !== 1) return notFound();
    const doc = await db.collection("protocols").findOne({ id: rest[0] }, { projection: { _id: 0 } });
    if (!doc) return notFound();
    try {
      await del(doc.url as string);
    } catch (err) {
      console.warn("blob del failed", err);
    }
    await db.collection("protocols").deleteOne({ id: rest[0] });
    return new Response(null, { status: 204 });
  }

  return new Response(null, { status: 405 });
}

async function dispatch(req: Request): Promise<Response> {
  const parts = segments(req);
  if (parts.length === 0) return notFound();
  const [resource, ...rest] = parts;

  switch (resource) {
    case "defects":
      return handleDefects(req, rest);
    case "suppliers":
      return handleSuppliers(req, rest);
    case "rooms":
      return handleLookup(roomsHandlers, req, rest);
    case "trades":
      return handleLookup(tradesHandlers, req, rest);
    case "protocols":
      return handleProtocols(req, rest);
    default:
      return notFound();
  }
}

export const GET = dispatch;
export const POST = dispatch;
export const PATCH = dispatch;
export const DELETE = dispatch;
