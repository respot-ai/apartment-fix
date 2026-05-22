import type { ZodError } from "zod";

export function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

export function badRequest(error: ZodError): Response {
  return json({ error: "invalid_request", details: error.flatten() }, { status: 400 });
}

export function notFound(): Response {
  return json({ error: "not_found" }, { status: 404 });
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
