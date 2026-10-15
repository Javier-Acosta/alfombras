import "server-only";
import { createHash } from "node:crypto";
import { privilegedClient } from "./server-pb";
import { formatMoney } from "./money";
import { validWhatsapp } from "./settings-values";
import type { OrderLine } from "./order-core";
export const hash = (v: string) => createHash("sha256").update(v).digest("hex");
export async function privateOrder(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const pb = await privilegedClient();
  const r = await pb
    .collection("orders")
    .getList(1, 1, {
      filter: pb.filter("tokenHash = {:hash}", { hash: hash(token) }),
    });
  return r.items[0] || null;
}
export function whatsappUrl(
  number: string,
  order: {
    reference: string;
    email: string;
    items: OrderLine[];
    totalMinor: number;
  },
) {
  if (!validWhatsapp(number)) return null;
  const text = [
    `Hola, quisiera coordinar el pedido ${order.reference}.`,
    ...order.items.map(
      (l) => `${l.name} × ${l.quantity} — ${formatMoney(l.subtotalMinor)}`,
    ),
    `Total: ${formatMoney(order.totalMinor)}`,
    `Email: ${order.email}`,
    "Pago y entrega a coordinar. Pedido sujeto a disponibilidad.",
  ].join("\n");
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
