import { formatMoney } from "./money.ts";
import { validWhatsapp } from "./settings-values.ts";
import type { OrderLine } from "./order-core.ts";

export type WhatsAppLine = OrderLine & {
  productUrl?: string;
  imageUrl?: string;
};
function safeLink(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
export function whatsappUrl(
  number: string,
  order: {
    reference: string;
    email: string;
    items: WhatsAppLine[];
    totalMinor: number;
    status?: string;
  },
) {
  if (!validWhatsapp(number)) return null;
  const text = [
    `Hola, quisiera ${order.status && order.status !== "pending" ? "consultar por" : "coordinar"} el pedido ${order.reference}.`,
    ...order.items.flatMap((line) => {
      const product = safeLink(line.productUrl);
      const photo = safeLink(line.imageUrl);
      return [
        `${line.name} × ${line.quantity} — ${formatMoney(line.subtotalMinor)}`,
        ...(product ? [`Ver alfombra: ${product}`] : []),
        ...(photo ? [`Foto: ${photo}`] : []),
        "",
      ];
    }),
    `Total: ${formatMoney(order.totalMinor)}`,
    `Email: ${order.email}`,
    order.status && order.status !== "pending"
      ? "Consulta sobre el pedido registrado."
      : "Pago y entrega a coordinar. Pedido sujeto a disponibilidad.",
  ].join("\n");
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
