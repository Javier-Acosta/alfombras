import Link from "next/link";
import { notFound } from "next/navigation";
import { publicOne, fileUrl } from "@/lib/content";
import { sanitizeRichText } from "@/lib/rich-text";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const n = await publicOne("news", id);
  if (!n) notFound();
  return (
    <article className="news-detail">
      <Link className="news-back" href="/noticias">
        ← Volver a noticias
      </Link>
      <p className="eyebrow pink">NOTICIAS DE LA FÁBRICA</p>
      <h1>{n.title}</h1>
      <time>
        {new Intl.DateTimeFormat("es-AR", {
          dateStyle: "long",
          timeZone: "UTC",
        }).format(new Date(n.published_on))}
      </time>
      <p className="news-detail-summary">{n.summary}</p>
      {n.image && (
        <img
          className="news-detail-image"
          src={fileUrl(n.collectionId, n.id, n.image)}
          alt={n.title}
        />
      )}
      <div
        className="news-body"
        dangerouslySetInnerHTML={{ __html: sanitizeRichText(n.content) }}
      />
    </article>
  );
}
