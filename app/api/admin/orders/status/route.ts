import { getAdminClient } from "@/lib/admin";
import { privilegedClient } from "@/lib/server-pb";
import { sameOrigin } from "@/lib/security";
import { isOrderStatus, orderTransitions } from "@/lib/order-status";

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
    typeof body.id !== "string" ||
    !/^[a-z0-9]{15}$/.test(body.id) ||
    !isOrderStatus(body.status) ||
    !isOrderStatus(body.previousStatus) ||
    Object.keys(body).some(
      (key) => !["id", "status", "previousStatus"].includes(key),
    )
  )
    return Response.json({ message: "Solicitud inválida." }, { status: 400 });
  const { id, status, previousStatus } = body;
  try {
    const pb = await privilegedClient();
    try {
      const order = await pb.collection("orders").getOne(id);
      if (order.archived)
        return Response.json(
          { message: "Recuperá el pedido antes de cambiar su estado." },
          { status: 409 },
        );
      if (order.status === status) return Response.json({ ok: true });
      if (
        order.status !== previousStatus ||
        !isOrderStatus(order.status) ||
        !orderTransitions[order.status].includes(status)
      )
        return Response.json(
          {
            message:
              "El estado del pedido cambió o la transición no está permitida. Recargá la lista.",
          },
          { status: 409 },
        );
      // No aceptar importes, productos, estado de archivo ni otros cambios del navegador.
      await pb.collection("orders").update(id, { status });
      return Response.json({ ok: true });
    } finally {
      pb.authStore.clear();
    }
  } catch (error) {
    const missing =
      error &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 404;
    return Response.json(
      {
        message: missing
          ? "No se encontró el pedido."
          : "No se pudo cambiar el estado. Revisá la conexión y reintentá.",
      },
      { status: missing ? 404 : 503 },
    );
  }
}
