import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDb } from "../_lib/mongo.js";
import {
  commentCreateSchema,
  defectCreateSchema,
  defectUpdateSchema,
} from "../_lib/validation.js";
import { badRequest, json, notFound, readJson } from "../_lib/http.js";
import { generateUniqueShortId } from "../_lib/shortid.js";

function segments(req: Request): string[] {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("defects");
  return idx === -1 ? [] : parts.slice(idx + 1).map(decodeURIComponent);
}

const commentPatchSchema = z.object({ text: z.string().min(1) });

export async function GET(req: Request): Promise<Response> {
  const parts = segments(req);
  const db = await getDb();

  if (parts.length === 0) {
    const docs = await db.collection("defects").find({}, { projection: { _id: 0 } }).toArray();
    return json(docs);
  }
  if (parts.length === 1) {
    const doc = await db.collection("defects").findOne({ id: parts[0] }, { projection: { _id: 0 } });
    return doc ? json(doc) : notFound();
  }
  return notFound();
}

export async function POST(req: Request): Promise<Response> {
  const parts = segments(req);
  const db = await getDb();

  if (parts.length === 0) {
    const body = await readJson(req);
    const parsed = defectCreateSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error);
    const doc = {
      id: randomUUID(),
      shortId: await generateUniqueShortId(db),
      reportedAt: parsed.data.reportedAt ?? new Date().toISOString().slice(0, 10),
      comments: [],
      activity: [],
      ...parsed.data,
    };
    await db.collection("defects").insertOne(doc);
    const { _id: _omit, ...returned } = doc as typeof doc & { _id?: unknown };
    return json(returned, { status: 201 });
  }

  if (parts.length === 2 && parts[1] === "comments") {
    const body = await readJson(req);
    const parsed = commentCreateSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error);
    const comment = {
      id: randomUUID(),
      at: parsed.data.at ?? new Date().toISOString(),
      ...parsed.data,
    };
    const result = await db.collection("defects").findOneAndUpdate(
      { id: parts[0] },
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

export async function PATCH(req: Request): Promise<Response> {
  const parts = segments(req);
  const db = await getDb();

  if (parts.length === 1) {
    const body = await readJson(req);
    const parsed = defectUpdateSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error);
    const result = await db.collection("defects").findOneAndUpdate(
      { id: parts[0] },
      { $set: parsed.data },
      { returnDocument: "after", projection: { _id: 0 } },
    );
    return result ? json(result) : notFound();
  }

  if (parts.length === 3 && parts[1] === "comments") {
    const body = await readJson(req);
    const parsed = commentPatchSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error);
    const result = await db
      .collection("defects")
      .findOneAndUpdate(
        { id: parts[0], "comments.id": parts[2] },
        { $set: { "comments.$.text": parsed.data.text } },
        { returnDocument: "after", projection: { _id: 0 } },
      );
    return result ? json(result) : notFound();
  }

  return notFound();
}

export async function DELETE(req: Request): Promise<Response> {
  const parts = segments(req);
  const db = await getDb();

  if (parts.length === 1) {
    const result = await db.collection("defects").deleteOne({ id: parts[0] });
    return result.deletedCount > 0 ? new Response(null, { status: 204 }) : notFound();
  }

  if (parts.length === 3 && parts[1] === "comments") {
    const result = await db
      .collection("defects")
      .findOneAndUpdate(
        { id: parts[0] },
        { $pull: { comments: { id: parts[2] } } as never },
        { returnDocument: "after", projection: { _id: 0 } },
      );
    return result ? json(result) : notFound();
  }

  return notFound();
}
