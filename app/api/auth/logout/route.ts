import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/admin";
import { sameOrigin } from "@/lib/security";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return new Response("Origen no permitido", { status: 403 });
  const response = NextResponse.redirect(
    new URL("/admin/login", request.url),
    303,
  );
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
