import PocketBase from "pocketbase";
const target = process.argv[2];
if (
  !target ||
  new URL(target).origin !== new URL(process.env.POCKETBASE_URL).origin
)
  throw new Error("Indicá explícitamente la instancia configurada.");
const pb = new PocketBase(target);
try {
  await pb
    .collection("_superusers")
    .authWithPassword(
      process.env.POCKETBASE_SUPERUSER_EMAIL,
      process.env.POCKETBASE_SUPERUSER_PASSWORD,
    );
  let collections = await pb.collections.getOne("collections");
  if (!collections.fields.some((f) => f.name === "slug"))
    collections = await pb.collections.update(collections.id, {
      fields: [
        ...collections.fields,
        {
          name: "slug",
          type: "text",
          max: 80,
          pattern: "^[a-z0-9]+(-[a-z0-9]+)*$",
        },
      ],
    });
  const index =
    "CREATE UNIQUE INDEX idx_collection_slug ON collections (slug) WHERE slug != ''";
  if (!collections.indexes.some((i) => i.includes("idx_collection_slug")))
    await pb.collections.update(collections.id, {
      indexes: [...collections.indexes, index],
    });
  const records = await pb
    .collection("collections")
    .getFullList({ sort: "created,id" });
  const used = new Set(records.map((r) => r.slug).filter(Boolean));
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
  ]);
  for (const r of records.filter((r) => !r.slug)) {
    let slug =
      r.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 64)
        .replace(/-$/, "") || "coleccion";
    if (reserved.has(slug)) slug = `coleccion-${slug}`;
    if (used.has(slug)) slug = `${slug}-${r.id}`;
    await pb.collection("collections").update(r.id, { slug });
    used.add(slug);
  }
  try {
    await pb.collections.getOne("designs");
  } catch (e) {
    if (e.status !== 404) throw e;
    const staff = "@request.auth.collectionName = 'staff'";
    await pb.collections.create({
      name: "designs",
      type: "base",
      listRule: `(published = true && collection.published = true) || (${staff})`,
      viewRule: `(published = true && collection.published = true) || (${staff})`,
      createRule: staff,
      updateRule: staff,
      deleteRule: staff,
      fields: [
        { name: "name", type: "text", required: true, max: 200 },
        { name: "description", type: "text", required: true, max: 5000 },
        {
          name: "collection",
          type: "relation",
          required: true,
          collectionId: collections.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: "image",
          type: "file",
          required: true,
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ["image/jpeg", "image/png", "image/webp"],
        },
        {
          name: "gallery",
          type: "file",
          maxSelect: 10,
          maxSize: 5242880,
          mimeTypes: ["image/jpeg", "image/png", "image/webp"],
          thumbs: ["160x160"],
        },
        { name: "published", type: "bool" },
        { name: "priority", type: "number", onlyInt: true, min: 0, max: 9999 },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    });
  }
  console.log(
    "Páginas de colecciones y diseños independientes preparados. No se copiaron ni modificaron productos de Tienda.",
  );
} catch (e) {
  console.error(e.response?.message || e.message);
  process.exitCode = 1;
} finally {
  pb.authStore.clear();
}
