"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/money";
import type { OrderLine } from "@/lib/order-core";
import { salesDateRange, saleInRange } from "@/lib/sales-report";
import {
  orderStatuses,
  orderTransitions,
  orderStatusActions,
  type OrderStatus,
} from "@/lib/order-status";

const tabs: Record<OrderStatus, { title: string; label: string }> = {
  pending: { title: "Pedidos pendientes", label: "Pendientes" },
  confirmed: { title: "Ventas confirmadas", label: "Ventas confirmadas" },
  delivered: { title: "Pedidos entregados", label: "Entregados" },
  cancelled: { title: "Pedidos cancelados", label: "Cancelados" },
};

export type AdminOrder = {
  id: string;
  reference: string;
  created: string;
  email: string;
  items: OrderLine[];
  totalMinor: number;
  archived: boolean;
  status: OrderStatus;
};
export function AdminOrders({ orders }: { orders: AdminOrder[] }) {
  const router = useRouter();
  const [history, setHistory] = useState(false);
  const [filter, setFilter] = useState<OrderStatus>("pending");
  const [saving, setBusy] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const busy = saving || refreshing;
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  let range: ReturnType<typeof salesDateRange> | undefined;
  let rangeError = "";
  try {
    range = salesDateRange(from, to);
  } catch (e) {
    rangeError = e instanceof Error ? e.message : "Fechas inválidas.";
  }
  const visible = orders.filter((o) =>
    history
      ? o.archived
      : !o.archived &&
        o.status === filter &&
        (filter !== "confirmed" ||
          Boolean(range && saleInRange(o.created, range))),
  );
  async function downloadSalesReport() {
    if (!range || !visible.length) return;
    setDownloading("report");
    setError("");
    try {
      const query = new URLSearchParams();
      if (from) query.set("from", from);
      if (to) query.set("to", to);
      const response = await fetch(
        `/api/admin/orders/confirmed-report?${query}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "No se pudo generar el informe.");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `ventas-confirmadas${from ? `-desde-${from}` : ""}${to ? `-hasta-${to}` : ""}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo generar el informe.",
      );
    } finally {
      setDownloading(null);
    }
  }
  async function downloadPdf(order: AdminOrder) {
    setDownloading(order.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/pdf`, {
        cache: "no-store",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "No se pudo descargar el PDF.");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `pedido-${order.reference.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60) || order.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo descargar el PDF.");
    } finally {
      setDownloading(null);
    }
  }
  async function changeStatus(order: AdminOrder, status: OrderStatus) {
    if (
      status === "cancelled" &&
      !confirm(
        `¿Cancelar el pedido ${order.reference}? Podrás volverlo a Pendiente si fuera necesario.`,
      )
    )
      return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: order.id,
          status,
          previousStatus: order.status,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setFilter(status);
      setHistory(false);
      setMessage(`Pedido ${order.reference}: ${orderStatuses[status]}.`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo cambiar el estado.",
      );
    } finally {
      startTransition(() => router.refresh());
      setBusy(false);
    }
  }
  async function archive(ids: string[], archived: boolean, all = false) {
    if (
      archived &&
      all &&
      !confirm(
        `¿Archivar los ${ids.length} pedidos de esta lista? Podrás recuperarlos desde Archivados.`,
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
          : "Pedido recuperado en la lista de su estado actual.",
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
      <h1>{history ? "Pedidos archivados" : tabs[filter].title}</h1>
      <p>
        Confirmá la venta cuando la acuerdes por WhatsApp y marcá Entregado
        cuando el cliente reciba la alfombra. El pago se coordina manualmente;
        cambiar el estado no registra un cobro ni modifica las existencias.
        Archivar conserva el historial.
      </p>
      <div className="form-actions" aria-label="Estado de los pedidos">
        {(Object.keys(tabs) as OrderStatus[]).map((status) => (
          <button
            key={status}
            type="button"
            className="secondary"
            aria-pressed={!history && filter === status}
            disabled={busy}
            onClick={() => {
              setFilter(status);
              setHistory(false);
              setMessage("");
              setError("");
            }}
          >
            {tabs[status].label} (
            {orders.filter((o) => !o.archived && o.status === status).length})
          </button>
        ))}
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
            className="secondary"
            disabled={busy}
            onClick={() =>
              archive(
                visible.map((o) => o.id),
                true,
                true,
              )
            }
          >
            {filter === "pending"
              ? "Archivar todos los pendientes"
              : "Archivar todos los mostrados"}
          </button>
        )}
      </div>
      {!history && filter === "confirmed" && (
        <form
          className="content-form"
          aria-label="Informe de ventas confirmadas"
          onSubmit={(event) => {
            event.preventDefault();
            void downloadSalesReport();
          }}
        >
          <h2>Informe para imprimir</h2>
          <p>
            Incluye ventas confirmadas sin archivar. Filtrá por fecha del pedido
            (horario de Argentina) o dejá las fechas vacías para incluir todas.
          </p>
          <div className="form-actions">
            <label>
              Desde
              <input
                type="date"
                value={from}
                disabled={busy || downloading !== null}
                onChange={(event) => {
                  setFrom(event.target.value);
                  setError("");
                }}
              />
            </label>
            <label>
              Hasta
              <input
                type="date"
                value={to}
                disabled={busy || downloading !== null}
                onChange={(event) => {
                  setTo(event.target.value);
                  setError("");
                }}
              />
            </label>
          </div>
          {rangeError && (
            <p className="form-error" role="alert">
              {rangeError}
            </p>
          )}
          <p aria-live="polite">
            <strong>
              {visible.length} ventas · Total general:{" "}
              {formatMoney(
                visible.reduce((sum, order) => sum + order.totalMinor, 0),
              )}
            </strong>
          </p>
          <div className="form-actions">
            <button
              type="submit"
              disabled={
                busy ||
                downloading !== null ||
                Boolean(rangeError) ||
                !visible.length
              }
            >
              {downloading === "report"
                ? "Generando informe…"
                : "Imprimir ventas confirmadas"}
            </button>
            <button
              type="button"
              className="secondary"
              disabled={busy || downloading !== null || (!from && !to)}
              onClick={() => {
                setFrom("");
                setTo("");
                setError("");
              }}
            >
              Limpiar fechas
            </button>
          </div>
          <p>
            Se descargará un PDF listo para imprimir. Es un registro interno; no
            es factura ni comprobante de pago.
          </p>
        </form>
      )}
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
            : filter === "pending"
              ? "No hay pedidos pendientes."
              : filter === "confirmed"
                ? "No hay ventas confirmadas en el período seleccionado."
                : "No hay pedidos en este estado."}
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
            · {orderStatuses[o.status]}
            {o.archived ? " · Archivado" : ""}
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
          <div className="form-actions">
            <button
              type="button"
              className="secondary"
              disabled={downloading !== null || busy}
              onClick={() => downloadPdf(o)}
            >
              {downloading === o.id ? "Generando PDF…" : "Descargar PDF"}
            </button>
            {!o.archived &&
              orderTransitions[o.status]?.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={
                    status === "confirmed" || status === "delivered"
                      ? undefined
                      : "secondary"
                  }
                  disabled={busy}
                  onClick={() => changeStatus(o, status)}
                >
                  {o.status === "delivered" && status === "confirmed"
                    ? "Volver a venta confirmada"
                    : orderStatusActions[status]}
                </button>
              ))}
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => archive([o.id], !o.archived)}
            >
              {o.archived
                ? o.status === "pending"
                  ? "Volver a pendientes"
                  : "Recuperar pedido"
                : "Archivar pedido"}
            </button>
          </div>
        </article>
      ))}
    </>
  );
}
