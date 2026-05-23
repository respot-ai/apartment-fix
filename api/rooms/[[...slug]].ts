import { makeLookupHandlers } from "../_lib/lookup.js";
import { defaultRooms } from "../_lib/seeds.js";
import { notFound } from "../_lib/http.js";

const handlers = makeLookupHandlers("rooms", defaultRooms);

function segments(req: Request): string[] {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("rooms");
  return idx === -1 ? [] : parts.slice(idx + 1).map(decodeURIComponent);
}

export async function GET(req: Request): Promise<Response> {
  return segments(req).length === 0 ? handlers.list() : notFound();
}

export async function POST(req: Request): Promise<Response> {
  return segments(req).length === 0 ? handlers.create(req) : notFound();
}

export async function DELETE(req: Request): Promise<Response> {
  return segments(req).length === 1 ? handlers.remove(req) : notFound();
}
