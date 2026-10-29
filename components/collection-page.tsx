import Link from "next/link";
import { published, fileUrl, type Content } from "@/lib/content";
import { ProductGallery } from "@/components/product-gallery";
import styles from "@/components/collection-designs.module.css";
export async function CollectionPage({
  collection: c,
}: {
  collection: Content;
}) {
  const products = await published<Content & { gallery?: string[] }>(
    "designs",
    `collection = "${c.id}"`,
  );
  return (
    <article className={`news-detail ${styles.page}`}>
      <Link className="news-back" href="/colecciones">
        ← Volver a colecciones
      </Link>
      <p className="eyebrow orange">COLECCIONES</p>
      <h1>{c.name}</h1>
      <p className="news-body">{c.description}</p>
      <div className={styles.grid}>
        {products.map((p) => (
          <article className={styles.card} key={p.id}>
            <ProductGallery
              name={p.name}
              images={[p.image, ...(p.gallery || [])]
                .filter(Boolean)
                .map((filename) => fileUrl(p.collectionId, p.id, filename))
                .filter((url): url is string => Boolean(url))}
            />
            <h2>{p.name}</h2>
            <p>{p.description}</p>
          </article>
        ))}
      </div>
      {!products.length && (
        <p>Próximamente publicaremos los diseños de esta colección.</p>
      )}
    </article>
  );
}
