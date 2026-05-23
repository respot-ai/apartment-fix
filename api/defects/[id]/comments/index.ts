import { randomUUID } from "node:crypto";
import { getDb } from "../../../_lib/mongo.js";
import { commentCreateSchema } from "../../../_lib/validation.js";
import { badRequest, json, notFound, readJson } from "../../../_lib/http.js";

function extractId(req: Request): string | null {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("defects");
  if (idx === -1 || idx + 1 >= parts.length) return null;
  return decodeURIComponent(parts[idx + 1]);
}

export async function POST(req: Request): Promise<Response> {
  const id = extractId(req);
  if (!id) return notFound();

  const body = await readJson(req);
  const parsed = commentCreateSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error);

  const comment = {
    id: randomUUID(),
    at: parsed.data.at ?? new Date().toISOString(),
    ...parsed.data,
  };

  const db = await getDb();
  const result = await db.collection("defects").findOneAndUpdate(
    { id },
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
