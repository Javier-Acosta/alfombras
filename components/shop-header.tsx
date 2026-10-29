import styles from "@/app/(shop)/shop.module.css";
export function ShopHeader({ title = "Tienda" }: { title?: string }) {
  return (
    <section className={styles.header} aria-labelledby="shop-title">
      <div className={styles.headerInner}>
        <p className={styles.eyebrow}>HECHO A MANO EN CATAMARCA</p>
        <h1 id="shop-title">{title}</h1>
        <p className={styles.intro}>
          Alfombras, tapices y piezas artesanales de nuestra fábrica. Elegí tu
          pieza y coordiná tu pedido por WhatsApp.
        </p>
      </div>
    </section>
  );
}
