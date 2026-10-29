const reserved = new Set([
  "admin",
  "api",
  "tienda",
  "colecciones",
  "noticias",
  "la-fabrica",
  "proceso-artesanal",
  "pedido",
  "icon",
  "favicon",
  "_next",
]);
export function validCollectionSlug(slug: string) {
  return (
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
    slug.length <= 80 &&
    !reserved.has(slug)
  );
}
export function collectionSlug(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64)
    .replace(/-$/, "");
  return validCollectionSlug(slug) ? slug : `coleccion-${slug || "nueva"}`;
}
export function collectionPath(c: { id: string; slug?: string }) {
  return c.slug && validCollectionSlug(c.slug)
    ? `/${c.slug}`
    : `/colecciones/${c.id}`;
}
