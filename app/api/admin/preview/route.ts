import { getAdminClient } from "@/lib/admin";
import { sameOrigin } from "@/lib/security";
import { sanitizeRichText } from "@/lib/rich-text";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  if (!(await getAdminClient())) return new Response(null, { status: 401 });
  if (Number(request.headers.get("content-length")) > 110000)
    return new Response(null, { status: 413 });
  const raw = await request.text();
  if (raw.length > 110000) return new Response(null, { status: 413 });
  try {
    const { content } = JSON.parse(raw);
    return Response.json(
      { html: sanitizeRichText(content) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return new Response(null, { status: 400 });
  }
}
