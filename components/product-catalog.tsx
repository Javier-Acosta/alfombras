"use client";
import { ProductGallery } from "./product-gallery";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Product } from "@/lib/content";
import { formatMoney } from "@/lib/money";
import type { CartLine } from "@/lib/order-core";
import styles from "@/app/(shop)/shop.module.css";
const storageKey = "alfombras-catamarca-cart";
function freshToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
}
export function ProductCatalog({
  products,
  selectedCollection,
  selectedProduct,
  canOrder,
  serviceConfigured,
}: {
  products: Product[];
  selectedCollection: string;
  selectedProduct?: string;
  canOrder: boolean;
  serviceConfigured: boolean;
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<Product | null>(
    () => products.find((p) => p.id === selectedProduct) || null,
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const token = useRef("");
  const dialog = useRef<HTMLDialogElement>(null);
  // Restore external browser storage after hydration; server HTML stays deterministic.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(raw))
        setCart(
          raw
            .filter(
              (l) =>
                l &&
                typeof l.id === "string" &&
                /^[a-z0-9]{15}$/.test(l.id) &&
                Number.isInteger(l.quantity) &&
                l.quantity >= 1 &&
                l.quantity <= 99,
            )
            .filter((l, i, a) => a.findIndex((x) => x.id === l.id) === i)
            .slice(0, 30),
        );
      token.current =
        sessionStorage.getItem("alfombras-confirmation") || freshToken();
    } catch {
      token.current = freshToken();
    }
    setLoaded(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (loaded)
      try {
        localStorage.setItem(storageKey, JSON.stringify(cart));
      } catch {
        /* El carrito sigue disponible durante esta visita. */
      }
  }, [cart, loaded]);
  useEffect(() => {
    if (selected && !dialog.current?.open) dialog.current?.showModal();
    else if (!selected && dialog.current?.open) dialog.current?.close();
  }, [selected]);
  const resetToken = () => {
    token.current = freshToken();
    try {
      sessionStorage.setItem("alfombras-confirmation", token.current);
    } catch {}
  };
  function updateCart(next: CartLine[]) {
    setCart(next);
    resetToken();
    setError("");
  }
  function add(p: Product) {
    if (p.sold || !p.published) return;
    const existing = cart.find((l) => l.id === p.id);
    if (existing && existing.quantity >= 99) {
      setError("El máximo por alfombra es de 99 unidades.");
      return;
    }
    if (!existing && cart.length >= 30) {
      setError("El máximo es de 30 alfombras diferentes.");
      return;
    }
    updateCart(
      existing
        ? cart.map((l) =>
            l.id === p.id ? { ...l, quantity: l.quantity + 1 } : l,
          )
        : [...cart, { id: p.id, quantity: 1 }],
    );
  }
  const lines = cart.map((l) => ({
    ...l,
    product: products.find((p) => p.id === l.id),
  }));
  const unit = (p: Product) => prices[p.id] ?? p.priceMinor;
  const total = lines.reduce(
    (n, l) => n + (l.product ? unit(l.product) * l.quantity : 0),
    0,
  );
  const unavailable = lines.some((l) => !l.product || l.product.sold);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const email = String(new FormData(e.currentTarget).get("email") || "");
    try {
      if (!token.current) resetToken();
      try {
        sessionStorage.setItem("alfombras-confirmation", token.current);
      } catch {}
      const r = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          items: cart,
          seenPrices: Object.fromEntries(
            lines.filter((l) => l.product).map((l) => [l.id, unit(l.product!)]),
          ),
          confirmationToken: token.current,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        if (d.prices) setPrices((p) => ({ ...p, ...d.prices }));
        throw new Error(d.message);
      }
      window.location.assign(d.url);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo guardar el pedido. El carrito se conserva.",
      );
    } finally {
      setBusy(false);
    }
  }
  const shown = products.filter(
    (p) => !selectedCollection || p.collection === selectedCollection,
  );
  return (
    <>
      <div className={styles.layout}>
        <section className={styles.products} aria-label="Productos">
          {!shown.length && (
            <p className={styles.empty}>
              Todavía no hay productos publicados
              {selectedCollection ? " en esta colección" : ""}.
            </p>
          )}
          {shown.map((p) => (
            <article className={styles.card} key={p.id}>
              <button
                className={styles.imageButton}
                onClick={() => setSelected(p)}
                aria-label={`Ver ${p.name} más grande`}
              >
                {p.imageUrl && <img src={p.imageUrl} alt={p.name} />}{" "}
                {p.sold && <span className={styles.sold}>Vendido</span>}
                <span className={styles.more}>Ver más</span>
              </button>
              <div className={styles.cardBody}>
                <button
                  className={styles.titleButton}
                  onClick={() => setSelected(p)}
                >
                  {p.name}
                </button>
                <p className={styles.description}>{p.description}</p>
                <div className={styles.buyRow}>
                  <span className={styles.price}>{formatMoney(unit(p))}</span>
                  <button
                    className={styles.button}
                    disabled={p.sold || busy || !loaded}
                    onClick={() => add(p)}
                  >
                    {p.sold ? "Vendido" : "Agregar"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
        <aside className={styles.cart}>
          <h2>Carrito</h2>
          {!loaded ? (
            <p className={styles.muted}>Cargando carrito…</p>
          ) : !cart.length ? (
            <p className={styles.muted}>El carrito está vacío.</p>
          ) : (
            <>
              {lines.map((l) => (
                <div className={styles.line} key={l.id}>
                  <div className={styles.lineHead}>
                    <div>
                      <h3>{l.product?.name || "Producto no disponible"}</h3>
                      <p className={styles.muted}>
                        {l.product
                          ? `${formatMoney(unit(l.product))} c/u${l.product.sold ? " · Vendido" : ""}`
                          : "Quitá este producto para continuar."}
                      </p>
                    </div>
                    <button
                      className={styles.remove}
                      disabled={busy}
                      onClick={() =>
                        updateCart(cart.filter((x) => x.id !== l.id))
                      }
                      aria-label={`Quitar ${l.product?.name || "producto"}`}
                    >
                      Quitar
                    </button>
                  </div>
                  <div className={styles.buyRow}>
                    <label className={styles.muted}>
                      Cantidad
                      <input
                        type="number"
                        min="1"
                        max="99"
                        step="1"
                        disabled={busy}
                        value={l.quantity}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isInteger(n) && n >= 1 && n <= 99)
                            updateCart(
                              cart.map((x) =>
                                x.id === l.id ? { ...x, quantity: n } : x,
                              ),
                            );
                        }}
                      />
                    </label>
                    {l.product && (
                      <strong>
                        {formatMoney(unit(l.product) * l.quantity)}
                      </strong>
                    )}
                  </div>
                </div>
              ))}
              <div className={styles.total}>
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>
              <form className={styles.form} onSubmit={submit}>
                <label>
                  Email de contacto
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    disabled={busy}
                    onChange={resetToken}
                  />
                </label>
                <button
                  className={styles.button}
                  disabled={
                    busy || unavailable || !canOrder || !serviceConfigured
                  }
                >
                  {busy ? "Preparando pedido…" : "Enviar pedido por WhatsApp"}
                </button>
                <p className={styles.fine}>
                  Se creará un pedido pendiente y se abrirá su resumen para
                  continuar por WhatsApp. Pago y entrega se coordinan
                  manualmente. El pedido no reserva existencias.
                </p>
                {unavailable && (
                  <p className={styles.error}>
                    Quitá los productos que ya no están disponibles.
                  </p>
                )}
              </form>
            </>
          )}
          {(!canOrder || !serviceConfigured) && (
            <p className={styles.muted}>
              Los pedidos todavía no están habilitados. El catálogo puede
              consultarse normalmente.
            </p>
          )}
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
        </aside>
      </div>
      <dialog
        className={styles.dialog}
        ref={dialog}
        onCancel={() => setSelected(null)}
        onClose={() => setSelected(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setSelected(null);
        }}
        aria-labelledby="product-title"
      >
        {selected && (
          <>
            <div className={styles.dialogTop}>
              {selected.imageUrl && (
                <ProductGallery
                  key={selected.id}
                  name={selected.name}
                  images={[selected.imageUrl, ...(selected.galleryUrls || [])]}
                />
              )}{" "}
              {selected.sold && <span className={styles.sold}>Vendido</span>}
              <button
                autoFocus
                className={styles.close}
                onClick={() => setSelected(null)}
              >
                Cerrar
              </button>
            </div>
            <div className={styles.detail}>
              <p className={styles.muted}>Alfombra</p>
              <h2 id="product-title">{selected.name}</h2>
              <p className={styles.description}>{selected.description}</p>
              {selected.measurements && <p>Medidas: {selected.measurements}</p>}
              {selected.materials && <p>Materiales: {selected.materials}</p>}
              <div className={styles.buyRow}>
                <span className={styles.price}>
                  {formatMoney(unit(selected))}
                </span>
                <button
                  className={styles.button}
                  disabled={selected.sold || busy}
                  onClick={() => {
                    add(selected);
                    setSelected(null);
                  }}
                >
                  {selected.sold ? "Vendido" : "Agregar al carrito"}
                </button>
              </div>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
