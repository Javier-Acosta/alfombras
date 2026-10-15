import { getAdminClient } from "@/lib/admin";
import { redirect } from "next/navigation";
import { formatMoney } from "@/lib/money";
export default async function Page() {
  const pb = await getAdminClient();
  if (!pb) redirect("/admin/login");
  const orders = await pb
    .collection("orders")
    .getFullList({ sort: "-created" });
  return (
    <>
      <p className="eyebrow orange">VENTAS POR WHATSAPP</p>
      <h1>Pedidos pendientes</h1>
      <p>
        El pago y la entrega se coordinan manualmente. Un pedido no reserva
        existencias.
      </p>
      {!orders.length && <p className="empty">Todavía no hay pedidos.</p>}
      {orders.map((o) => (
        <article className="content-form" key={o.id}>
          <h2>{o.reference}</h2>
          <p>
            {new Intl.DateTimeFormat("es-AR", {
              dateStyle: "short",
              timeStyle: "short",
              timeZone: "America/Argentina/Buenos_Aires",
            }).format(new Date(o.created))}{" "}
            · Pendiente
          </p>
          <p>Contacto: {o.email}</p>
          <ul>
            {(
              o.items as {
                id: string;
                name: string;
                quantity: number;
                unitPriceMinor: number;
              }[]
            ).map((l, i) => (
              <li key={`${l.id}-${i}`}>
                {l.name} × {l.quantity} ·{" "}
                {formatMoney(l.unitPriceMinor * l.quantity)}
              </li>
            ))}
          </ul>
          <strong>Total: {formatMoney(o.totalMinor)}</strong>
        </article>
      ))}
    </>
  );
}
