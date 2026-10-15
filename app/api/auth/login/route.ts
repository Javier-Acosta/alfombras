import { NextResponse } from "next/server";
import { createPocketBase } from "@/lib/pocketbase";
import { SESSION_COOKIE } from "@/lib/admin";
import { sameOrigin, allowRequest, requestKey } from "@/lib/security";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ message: "Origen no permitido." }, { status: 403 });
  if (!allowRequest(`login:${requestKey(request)}`, 10))
    return Response.json(
      { message: "Demasiados intentos. Esperá un minuto." },
      { status: 429 },
    );
  try {
    const { email, password } = await request.json();
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      email.length > 254 ||
      password.length > 200
    )
      throw new Error();
    const auth = await createPocketBase()
      .collection("staff")
      .authWithPassword(email, password);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, auth.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 28800,
    });
    return response;
  } catch {
    return Response.json(
      {
        message:
          "No pudimos iniciar sesión. Revisá las credenciales y la conexión.",
      },
      { status: 401 },
    );
  }
}
