import Link from "next/link";
import { fileUrl } from "@/lib/pocketbase";
import type { Content } from "@/lib/content";
export function NewsCards({ items }: { items: Content[] }) {
  return (
    <div className="news-grid">
      {items.map((n) => (
        <article className="news-card" key={n.id}>
          <Link className="news-card-link" href={`/noticias/${n.id}`}>
            {n.image && (
              <img
                src={fileUrl(n.collectionId, n.id, n.image)}
                alt=""
                loading="lazy"
              />
            )}
            <time>
              {new Intl.DateTimeFormat("es-AR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              }).format(new Date(n.published_on))}
            </time>
            <h3>{n.title}</h3>
            <p>{n.summary}</p>
            <span className="news-read-more">Leer noticia →</span>
          </Link>
        </article>
      ))}
    </div>
  );
}
export function CollectionCards({ items }: { items: Content[] }) {
  return (
    <div className="guest-grid">
      {items.map((c) => (
        <article className="guest-card" key={c.id}>
          <Link className="guest-card-link" href={`/colecciones/${c.id}`}>
            {c.image && (
              <img
                src={fileUrl(c.collectionId, c.id, c.image)}
                alt={c.name}
                loading="lazy"
              />
            )}
            <h3>{c.name}</h3>
            <p>{c.description}</p>
            <span className="news-read-more">Conocer colección →</span>
          </Link>
        </article>
      ))}
    </div>
  );
}
