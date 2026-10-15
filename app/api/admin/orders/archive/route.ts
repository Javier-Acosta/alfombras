import { getAdminClient } from "@/lib/admin";
import { privilegedClient } from "@/lib/server-pb";
import { sameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ message: "Origen no permitido." }, { status: 403 });
  if (!(await getAdminClient()))
    return Response.json({ message: "No autorizado." }, { status: 401 });
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Solicitud inválida." }, { status: 400 });
  }
  if (
    !body ||
    typeof body.archived !== "boolean" ||
    !Array.isArray(body.ids) ||
    body.ids.length < 1 ||
    body.ids.length > 100 ||
    body.ids.some(
      (id: unknown) => typeof id !== "string" || !/^[a-z0-9]{15}$/.test(id),
    ) ||
    new Set(body.ids).size !== body.ids.length ||
    Object.keys(body).some((key) => !["ids", "archived"].includes(key))
  )
    return Response.json({ message: "Solicitud inválida." }, { status: 400 });
  try {
    // Solo el servidor modifica este campo, tras validar la sesión del personal.
    // La API directa de PocketBase continúa bloqueando la edición de pedidos.
    const pb = await privilegedClient();
    const updatedIds: string[] = [];
    try {
      for (const id of body.ids) {
        await pb.collection("orders").update(id, { archived: body.archived });
        updatedIds.push(id);
      }
    } finally {
      pb.authStore.clear();
    }
    return Response.json(
      { updatedIds },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json(
      {
        message:
          "No se pudo completar la operación. Recargá la lista para comprobar los pedidos y reintentá.",
      },
      { status: 503 },
    );
  }
}
