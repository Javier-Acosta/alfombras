"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/money";
import type { OrderLine } from "@/lib/order-core";

export type AdminOrder = {
  id: string;
  reference: string;
  created: string;
  email: string;
  items: OrderLine[];
  totalMinor: number;
  archived: boolean;
};
export function AdminOrders({ orders }: { orders: AdminOrder[] }) {
  const router = useRouter();
  const [history, setHistory] = useState(false);
  const [saving, setBusy] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const busy = saving || refreshing;
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const visible = orders.filter((o) => Boolean(o.archived) === history);
  async function archive(ids: string[], archived: boolean, all = false) {
    if (
      archived &&
      all &&
      !confirm(
        `¿Archivar los ${ids.length} pedidos pendientes? Podrás recuperarlos desde Archivados.`,
      )
    )
      return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      for (let i = 0; i < ids.length; i += 100) {
        const response = await fetch("/api/admin/orders/archive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: ids.slice(i, i + 100), archived }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
      }
      setMessage(
        archived
          ? "Pedidos archivados. Se conservaron todos sus datos."
          : "Pedido recuperado en Pendientes.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo completar la operación.",
      );
    } finally {
      startTransition(() => router.refresh());
      setBusy(false);
    }
  }
  return (
    <>
      <p className="eyebrow orange">VENTAS POR WHATSAPP</p>
      <h1>{history ? "Pedidos archivados" : "Pedidos pendientes"}</h1>
      <p>
        El pago y la entrega se coordinan manualmente. Archivar conserva el
        historial y no marca el pedido como pagado ni modifica las existencias.
      </p>
      <div className="form-actions" aria-label="Estado de los pedidos">
        <button
          type="button"
          className="secondary"
          aria-pressed={!history}
          disabled={busy}
          onClick={() => {
            setHistory(false);
            setMessage("");
            setError("");
          }}
        >
          Pendientes ({orders.filter((o) => !o.archived).length})
        </button>
        <button
          type="button"
          className="secondary"
          aria-pressed={history}
          disabled={busy}
          onClick={() => {
            setHistory(true);
            setMessage("");
            setError("");
          }}
        >
          Archivados ({orders.filter((o) => o.archived).length})
        </button>
        {!history && visible.length > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              archive(
                visible.map((o) => o.id),
                true,
                true,
              )
            }
          >
            Archivar todos los pendientes
          </button>
        )}
      </div>
      {busy && <p role="status">Guardando…</p>}
      {message && (
        <p role="status" className="manager-message">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {!visible.length && (
        <p className="empty">
          {history
            ? "No hay pedidos archivados."
            : "No hay pedidos pendientes."}
        </p>
      )}
      {visible.map((o) => (
        <article className="content-form" key={o.id}>
          <h2>{o.reference}</h2>
          <p>
            {new Intl.DateTimeFormat("es-AR", {
              dateStyle: "short",
              timeStyle: "short",
              timeZone: "America/Argentina/Buenos_Aires",
            }).format(new Date(o.created))}{" "}
            · {o.archived ? "Archivado" : "Pendiente"}
          </p>
          <p>Contacto: {o.email}</p>
          <ul>
            {o.items.map((line, i) => (
              <li key={`${line.id}-${i}`}>
                {line.name} × {line.quantity} ·{" "}
                {formatMoney(line.unitPriceMinor * line.quantity)}
              </li>
            ))}
          </ul>
          <p>
            <strong>Total: {formatMoney(o.totalMinor)}</strong>
          </p>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={() => archive([o.id], !o.archived)}
          >
            {o.archived ? "Volver a pendientes" : "Archivar pedido"}
          </button>
        </article>
      ))}
    </>
  );
}
