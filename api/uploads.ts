import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { json, readJson } from "./_lib/http.js";

export async function POST(req: Request): Promise<Response> {
  const body = (await readJson(req)) as HandleUploadBody | null;
  if (!body) return json({ error: "invalid_request" }, { status: 400 });

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const isProtocol = pathname.startsWith("protocols/");
        return {
          allowedContentTypes: isProtocol
            ? ["application/pdf"]
            : ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
          addRandomSuffix: true,
          maximumSizeInBytes: isProtocol ? 50 * 1024 * 1024 : 15 * 1024 * 1024,
          tokenPayload: JSON.stringify({ pathname }),
        };
      },
      onUploadCompleted: async () => {
        // No-op: defect is updated client-side after upload completes.
      },
    });
    return json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "upload_failed";
    return json({ error: message }, { status: 400 });
  }
}
