import { z } from "zod";
import { getDb } from "../../../_lib/mongo.js";
import { badRequest, json, notFound, readJson } from "../../../_lib/http.js";

function extractIds(req: Request): { defectId: string; commentId: string } | null {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const dIdx = parts.indexOf("defects");
  const cIdx = parts.indexOf("comments");
  if (dIdx === -1 || cIdx === -1 || dIdx + 1 >= parts.length || cIdx + 1 >= parts.length) {
    return null;
  }
  return {
    defectId: decodeURIComponent(parts[dIdx + 1]),
    commentId: decodeURIComponent(parts[cIdx + 1]),
  };
}

const commentPatchSchema = z.object({ text: z.string().min(1) });

export async function PATCH(req: Request): Promise<Response> {
  const ids = extractIds(req);
  if (!ids) return notFound();

  const body = await readJson(req);
  const parsed = commentPatchSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error);

  const db = await getDb();
  const result = await db
    .collection("defects")
    .findOneAndUpdate(
      { id: ids.defectId, "comments.id": ids.commentId },
      { $set: { "comments.$.text": parsed.data.text } },
      { returnDocument: "after", projection: { _id: 0 } },
    );
  return result ? json(result) : notFound();
}

export async function DELETE(req: Request): Promise<Response> {
  const ids = extractIds(req);
  if (!ids) return notFound();

  const db = await getDb();
  const result = await db
    .collection("defects")
    .findOneAndUpdate(
      { id: ids.defectId },
      { $pull: { comments: { id: ids.commentId } } as never },
      { returnDocument: "after", projection: { _id: 0 } },
    );
  return result ? json(result) : notFound();
}
