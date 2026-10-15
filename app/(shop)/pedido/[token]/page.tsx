import Link from "next/link";
import { notFound } from "next/navigation";
import { privateOrder, whatsappUrl } from "@/lib/orders";
import { getSiteSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import type { OrderLine } from "@/lib/order-core";
import styles from "../../shop.module.css";
export const metadata = {
  title: "Resumen del pedido",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await privateOrder(token);
  if (!order) notFound();
  const s = await getSiteSettings();
  const url = whatsappUrl(s.whatsapp, {
    reference: order.reference,
    email: order.email,
    items: order.items,
    totalMinor: order.totalMinor,
  });
  return (
    <main id="contenido" className={styles.container}>
      <article className={styles.summary}>
        <p className={styles.brand}>Fábrica de Alfombras Catamarca</p>
        <h1>Tu pedido está pendiente</h1>
        <p>
          Referencia: <strong>{order.reference}</strong>
        </p>
        <p>Email de contacto: {order.email}</p>
        <ul>
          {(order.items as OrderLine[]).map((l, i) => (
            <li key={i}>
              {l.name} × {l.quantity} — {formatMoney(l.subtotalMinor)}
            </li>
          ))}
        </ul>
        <strong>Total: {formatMoney(order.totalMinor)}</strong>
        <p className={styles.muted}>
          Abrí WhatsApp y enviá el mensaje para coordinar el pago y la entrega.
          Este pedido no reserva existencias ni confirma una compra pagada.
        </p>
        {url ? (
          <a
            className={styles.button}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Continuar por WhatsApp ↗
          </a>
        ) : (
          <p className={styles.error}>
            El WhatsApp comercial no está disponible. Conservá la referencia del
            pedido.
          </p>
        )}
        <p className={styles.fine}>
          Si WhatsApp no abre, volvé a usar el botón. El pedido ya está guardado
          y no se creará otro. Abrir WhatsApp no confirma que el mensaje se haya
          enviado.
        </p>
        <Link href="/tienda">← Volver a la tienda</Link>
      </article>
    </main>
  );
}
