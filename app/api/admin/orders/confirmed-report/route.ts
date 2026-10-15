import { getAdminClient } from "@/lib/admin";
import { getSiteSettings } from "@/lib/settings";
import { salesDateRange } from "@/lib/sales-report";
import { createSalesReportPdf } from "@/lib/sales-report-pdf";
import type { PdfOrder } from "@/lib/order-pdf";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const fail = (message: string, status: number) =>
    Response.json(
      { message },
      { status, headers: { "Cache-Control": "private, no-store" } },
    );
  const pb = await getAdminClient();
  if (!pb) return fail("No autorizado.", 401);
  const query = new URL(request.url).searchParams;
  if (
    [...query.keys()].some((key) => !["from", "to"].includes(key)) ||
    query.getAll("from").length > 1 ||
    query.getAll("to").length > 1
  )
    return fail("Filtro inválido.", 400);
  let range;
  try {
    range = salesDateRange(query.get("from") || "", query.get("to") || "");
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Fechas inválidas.",
      400,
    );
  }
  try {
    const filters = ["status = 'confirmed'", "archived = false"];
    if (range.start)
      filters.push(
        pb.filter("created >= {:date}", {
          date: range.start.replace("T", " "),
        }),
      );
    if (range.end)
      filters.push(
        pb.filter("created <= {:date}", { date: range.end.replace("T", " ") }),
      );
    const orders = await pb.collection("orders").getFullList<PdfOrder>({
      filter: filters.join(" && "),
      sort: "created,id",
      fields:
        "reference,created,email,status,archived,items,totalMinor,currency",
    });
    if (!orders.length)
      return fail(
        "No hay ventas confirmadas para el período seleccionado.",
        404,
      );
    const pdf = await createSalesReportPdf(
      orders,
      await getSiteSettings(),
      range,
    );
    const filename = `ventas-confirmadas${range.from ? `-desde-${range.from}` : ""}${range.to ? `-hasta-${range.to}` : ""}.pdf`;
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        Vary: "Cookie",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch {
    return fail(
      "No se pudo generar el informe. Revisá la conexión y reintentá.",
      503,
    );
  }
}
