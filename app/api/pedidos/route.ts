import { randomBytes } from "node:crypto";
import { privilegedClient } from "@/lib/server-pb";
import { hash } from "@/lib/orders";
import { parseCart, priceOrder, type PricedProduct } from "@/lib/order-core";
import { sameOrigin, allowRequest, requestKey } from "@/lib/security";
import { SETTINGS_ID, validWhatsapp } from "@/lib/settings-values";
export async function POST(request: Request) {
  const fail = (message: string, status = 400, extra = {}) =>
    Response.json(
      { message, ...extra },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  if (!sameOrigin(request)) return fail("Origen no permitido.", 403);
  if (!allowRequest(`order:${requestKey(request)}`, 12))
    return fail(
      "Demasiados intentos. Esperá un minuto y volvé a intentar.",
      429,
    );
  if (Number(request.headers.get("content-length")) > 16000)
    return fail("El pedido supera el tamaño permitido.", 413);
  try {
    const raw = await request.text();
    if (raw.length > 16000)
      return fail("El pedido supera el tamaño permitido.", 413);
    const body = JSON.parse(raw);
    const lines = parseCart(body.items);
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (email.length > 254 || !/^\S+@[^\s@]+\.[^\s@]+$/.test(email))
      return fail("Ingresá un email de contacto válido.");
    const token = body.confirmationToken;
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token))
      return fail("Volvé a confirmar el pedido desde el carrito.");
    const key = hash(token);
    const fingerprint = hash(
      JSON.stringify({
        email,
        items: [...lines].sort((a, b) => a.id.localeCompare(b.id)),
      }),
    );
    const pb = await privilegedClient();
    const findExisting = async () =>
      (
        await pb
          .collection("orders")
          .getList(1, 1, {
            filter: pb.filter("idempotencyKey = {:key}", { key }),
          })
      ).items[0];
    const existing = await findExisting();
    if (existing) {
      if (existing.requestHash !== fingerprint)
        return fail(
          "Esta confirmación ya corresponde a otro pedido. Recargá el carrito.",
          409,
        );
      return Response.json(
        { url: `/pedido/${token}` },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const settings = await pb.collection("site_settings").getOne(SETTINGS_ID);
    if (!validWhatsapp(settings.whatsapp))
      return fail(
        "La tienda todavía no tiene configurado el WhatsApp comercial.",
        503,
      );
    const products = await Promise.all(
      lines.map((l) =>
        pb
          .collection("products")
          .getOne<PricedProduct>(l.id)
          .catch(() => null),
      ),
    );
    const order = priceOrder(
      lines,
      products.filter((p): p is PricedProduct => p !== null),
    );
    const seen = body.seenPrices;
    if (
      !seen ||
      typeof seen !== "object" ||
      order.items.some((l) => seen[l.id] !== l.unitPriceMinor)
    )
      return fail(
        "Los precios se actualizaron. Revisá el nuevo total y confirmá nuevamente.",
        409,
        {
          prices: Object.fromEntries(
            order.items.map((l) => [l.id, l.unitPriceMinor]),
          ),
        },
      );
    try {
      await pb
        .collection("orders")
        .create({
          reference: `FAC-${randomBytes(6).toString("hex").toUpperCase()}`,
          tokenHash: key,
          idempotencyKey: key,
          requestHash: fingerprint,
          email,
          status: "pending",
          ...order,
          currency: "ARS",
        });
    } catch (e) {
      const saved = await findExisting();
      if (!saved || saved.requestHash !== fingerprint) throw e;
    }
    return Response.json(
      { url: `/pedido/${token}` },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return fail(
      e instanceof Error && !("status" in e) && !(e instanceof SyntaxError)
        ? e.message
        : "No pudimos guardar el pedido. El carrito se conserva; volvé a intentar.",
    );
  }
}
