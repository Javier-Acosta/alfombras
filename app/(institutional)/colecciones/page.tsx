import { published } from "@/lib/content";
import { CollectionCards } from "@/components/content-cards";
export const metadata = { title: "Colecciones" };
export default async function Page() {
  let items;
  try {
    items = await published("collections");
  } catch {
    items = null;
  }
  return (
    <section className="section guests-section news-index">
      <p className="eyebrow orange">NUESTRAS ALFOMBRAS</p>
      <h1>Colecciones</h1>
      {items?.length ? (
        <CollectionCards items={items} />
      ) : (
        <p className="empty">
          {items
            ? "Muy pronto compartiremos nuestras colecciones."
            : "No pudimos cargar las colecciones. Volvé a intentar."}
        </p>
      )}
    </section>
  );
}
