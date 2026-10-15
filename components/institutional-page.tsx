import { published, fileUrl } from "@/lib/content";
import { sanitizeRichText } from "@/lib/rich-text";
export async function InstitutionalPage({
  pageKey,
  title,
}: {
  pageKey: "factory" | "process";
  title: string;
}) {
  let item;
  let failed = false;
  try {
    item = (await published("institutional_pages", `key = '${pageKey}'`))[0];
  } catch {
    failed = true;
  }
  return (
    <article className="news-detail">
      <p className="eyebrow orange">FÁBRICA DE ALFOMBRAS CATAMARCA</p>
      <h1>{item?.title || title}</h1>
      {item ? (
        <>
          {item.image && (
            <img
              className="news-detail-image"
              src={fileUrl(item.collectionId, item.id, item.image)}
              alt={item.title}
            />
          )}
          <div
            className="news-body"
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.content) }}
          />
        </>
      ) : (
        <p className="empty">
          {failed
            ? "No pudimos cargar esta sección. Volvé a intentar en unos minutos."
            : "Muy pronto compartiremos más información en esta sección."}
        </p>
      )}
    </article>
  );
}
