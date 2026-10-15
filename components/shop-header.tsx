import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";
import styles from "@/app/(shop)/shop.module.css";
export async function ShopHeader({
  title = "Productos disponibles",
}: {
  title?: string;
}) {
  const s = await getSiteSettings();
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div>
          <Link href="/tienda" className={styles.brand}>
            {s.site_name}
          </Link>
          <h1>{title}</h1>
        </div>
        <nav className={styles.nav} aria-label="Navegación de tienda">
          <Link href="/">Inicio</Link>
          <Link href="/colecciones">Colecciones</Link>
          <Link href="/admin">Vendedor</Link>
        </nav>
      </div>
    </header>
  );
}
