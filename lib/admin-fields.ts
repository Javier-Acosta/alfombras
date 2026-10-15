export type Field = {
  name: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "date"
    | "url"
    | "file"
    | "checkbox"
    | "collection"
    | "pagekey";
  required?: boolean;
};
export const definitions: Record<string, Field[]> = {
  news: [
    { name: "title", label: "Título", type: "text", required: true },
    { name: "summary", label: "Resumen", type: "textarea", required: true },
    { name: "content", label: "Contenido", type: "textarea", required: true },
    {
      name: "published_on",
      label: "Fecha de publicación",
      type: "date",
      required: true,
    },
    { name: "image", label: "Imagen (hasta 5 MB)", type: "file" },
  ],
  reels: [
    { name: "title", label: "Título", type: "text", required: true },
    {
      name: "url",
      label: "Enlace HTTPS al reel de Instagram",
      type: "url",
      required: true,
    },
    { name: "image", label: "Portada (hasta 5 MB)", type: "file" },
  ],
  banners: [
    {
      name: "title",
      label: "Descripción de la imagen",
      type: "text",
      required: true,
    },
    {
      name: "image",
      label: "Banner (hasta 10 MB)",
      type: "file",
      required: true,
    },
  ],
  institutional_pages: [
    { name: "key", label: "Sección", type: "pagekey", required: true },
    { name: "title", label: "Título", type: "text", required: true },
    { name: "content", label: "Contenido", type: "textarea", required: true },
    { name: "image", label: "Imagen (hasta 5 MB)", type: "file" },
  ],
  collections: [
    { name: "name", label: "Nombre", type: "text", required: true },
    {
      name: "description",
      label: "Descripción",
      type: "textarea",
      required: true,
    },
    {
      name: "image",
      label: "Imagen (hasta 5 MB)",
      type: "file",
      required: true,
    },
  ],
  products: [
    { name: "name", label: "Nombre", type: "text", required: true },
    {
      name: "description",
      label: "Descripción",
      type: "textarea",
      required: true,
    },
    {
      name: "priceMinor",
      label: "Precio en centavos ARS (ej.: $10.000 = 1000000)",
      type: "number",
      required: true,
    },
    { name: "measurements", label: "Medidas", type: "text" },
    { name: "materials", label: "Materiales", type: "text" },
    { name: "collection", label: "Colección", type: "collection" },
    {
      name: "image",
      label: "Imagen (hasta 5 MB)",
      type: "file",
      required: true,
    },
    { name: "sold", label: "Vendido", type: "checkbox" },
  ],
};
export const collectionLabels: Record<string, string> = {
  news: "Noticias",
  reels: "Reels de Instagram",
  banners: "Banner",
  institutional_pages: "La fábrica y proceso artesanal",
  collections: "Colecciones",
  products: "Tienda",
};
export function isCollection(name: string) {
  return Object.hasOwn(definitions, name);
}
export function contentSort(name: string) {
  return name === "banners"
    ? "-priority,-updated,-created"
    : "-priority,-created,-id";
}
