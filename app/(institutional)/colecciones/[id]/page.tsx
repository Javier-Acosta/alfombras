import Link from "next/link";
import { notFound } from "next/navigation";
import { publicOne, fileUrl } from "@/lib/content";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await publicOne("collections", id);
  if (!c) notFound();
  return (
    <article className="news-detail">
      <Link className="news-back" href="/colecciones">
        ← Volver a colecciones
      </Link>
      <p className="eyebrow orange">COLECCIONES</p>
      <h1>{c.name}</h1>
      {c.image && (
        <img
          className="news-detail-image"
          src={fileUrl(c.collectionId, c.id, c.image)}
          alt={c.name}
        />
      )}
      <p className="news-body">{c.description}</p>
      <Link className="news-view-all" href={`/tienda?coleccion=${c.id}`}>
        Ver alfombras de esta colección →
      </Link>
    </article>
  );
}
