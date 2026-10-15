import { getAdminClient } from "@/lib/admin";
import { getSiteSettings } from "@/lib/settings";
import { createOrderPdf, type PdfOrder } from "@/lib/order-pdf";

export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const pb = await getAdminClient();
  if (!pb) return Response.json({ message: "No autorizado." }, { status: 401 });
  const { id } = await params;
  if (!/^[a-z0-9]{15}$/.test(id))
    return Response.json(
      { message: "Identificador inválido." },
      { status: 400 },
    );
  try {
    const order = await pb.collection("orders").getOne<PdfOrder>(id, {
      fields:
        "reference,created,email,status,archived,items,totalMinor,currency",
    });
    const pdf = await createOrderPdf(order, await getSiteSettings());
    const reference =
      order.reference.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60) || id;
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="pedido-${reference}.pdf"`,
        "Cache-Control": "private, no-store",
        Vary: "Cookie",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
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
          : "No se pudo generar el PDF. Reintentá en unos instantes.",
      },
      { status: missing ? 404 : 503 },
    );
  }
}
