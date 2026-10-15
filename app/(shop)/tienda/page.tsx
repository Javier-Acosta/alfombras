import Link from "next/link";
import { published, fileUrl, type Product, type Content } from "@/lib/content";
import { getSiteSettings } from "@/lib/settings";
import { validWhatsapp } from "@/lib/settings-values";
import { ShopHeader } from "@/components/shop-header";
import { ProductCatalog } from "@/components/product-catalog";
import styles from "../shop.module.css";
export const metadata = { title: "Tienda" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ coleccion?: string; alfombra?: string }>;
}) {
  const query = await searchParams;
  const selected = query.coleccion || "";
  const s = await getSiteSettings();
  let products: Product[] | null;
  let collections: Content[];
  try {
    products = await published<Product>("products");
  } catch {
    products = null;
  }
  try {
    collections = await published("collections");
  } catch {
    collections = [];
  }
  const allowed = collections.some((c) => c.id === selected) ? selected : "";
  return (
    <>
      <ShopHeader />
      <main id="contenido" className={styles.container}>
        <nav className={styles.filters} aria-label="Filtrar por colección">
          <Link className={!allowed ? styles.active : undefined} href="/tienda">
            Todas las alfombras
          </Link>
          {collections.map((c) => (
            <Link
              className={allowed === c.id ? styles.active : undefined}
              key={c.id}
              href={`/tienda?coleccion=${c.id}`}
            >
              {c.name}
            </Link>
          ))}
        </nav>
        {products ? (
          <ProductCatalog
            products={products.map((p) => ({
              ...p,
              imageUrl: fileUrl(p.collectionId, p.id, p.image),
            }))}
            selectedCollection={allowed}
            selectedProduct={query.alfombra}
            canOrder={validWhatsapp(s.whatsapp)}
            serviceConfigured={Boolean(
              process.env.POCKETBASE_SUPERUSER_EMAIL &&
              process.env.POCKETBASE_SUPERUSER_PASSWORD,
            )}
          />
        ) : (
          <div className={styles.empty} role="alert">
            <h2>No pudimos cargar el catálogo</h2>
            <p>Volvé a intentar en unos minutos.</p>
            <Link href="/tienda">Reintentar</Link>
          </div>
        )}
      </main>
      <div className={styles.footer}>
        Pago y entrega a coordinar manualmente por WhatsApp.
      </div>
    </>
  );
}
