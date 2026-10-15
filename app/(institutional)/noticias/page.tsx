import { published } from "@/lib/content";
import { NewsCards } from "@/components/content-cards";
export const metadata = { title: "Noticias" };
export default async function Page() {
  let items;
  try {
    items = await published("news");
  } catch {
    items = null;
  }
  return (
    <section className="section news-section news-index">
      <p className="eyebrow pink">AL DÍA</p>
      <h1>Noticias de la fábrica</h1>
      {items?.length ? (
        <NewsCards items={items} />
      ) : (
        <p className="empty">
          {items
            ? "Las novedades de la fábrica aparecerán aquí."
            : "No pudimos cargar las noticias. Volvé a intentar."}
        </p>
      )}
    </section>
  );
}
