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
  try {
    await pb.collections.getOne("mosaic_tiles");
  } catch (e) {
    if (e.status !== 404) throw e;
    const staff = "@request.auth.collectionName = 'staff'";
    await pb.collections.create({
      name: "mosaic_tiles",
      type: "base",
      listRule: `published = true || (${staff})`,
      viewRule: `published = true || (${staff})`,
      createRule: staff,
      updateRule: staff,
      deleteRule: staff,
      fields: [
        {
          name: "image",
          type: "file",
          required: true,
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ["image/jpeg", "image/png", "image/webp"],
          thumbs: ["600x450"],
        },
        { name: "target", type: "text", required: true, max: 180 },
        { name: "published", type: "bool" },
        { name: "priority", type: "number", onlyInt: true, min: 0, max: 9999 },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    });
  }
  // Guardar una instantánea independiente de las fotos anteriores. Reejecutar no las duplica.
  const config = await pb.collection("home_mosaic").getOne("mosaicconfig001");
  if (
    config.products?.length &&
    !(await pb.collection("mosaic_tiles").getList(1, 1)).totalItems
  ) {
    for (const [index, id] of config.products.entries()) {
      const p = await pb.collection("products").getOne(id);
      if (!p.image || !p.collection) continue;
      const c = await pb.collection("collections").getOne(p.collection);
      if (!c.slug || !c.published) continue;
      const r = await fetch(pb.files.getURL(p, p.image));
      if (!r.ok) throw new Error("No se pudo copiar una foto anterior.");
      const blob = await r.blob();
      const data = new FormData();
      data.set("image", new File([blob], p.image, { type: blob.type }));
      data.set("target", `/${c.slug}`);
      data.set("priority", String(100 - index));
      data.set("published", String(p.published));
      await pb.collection("mosaic_tiles").create(data);
    }
  }
  console.log(
    "Mosaico independiente preparado. Las fotos anteriores disponibles se conservaron como copias con destino a su colección.",
  );
} catch (e) {
  console.error(e.response?.message || e.message);
  process.exitCode = 1;
} finally {
  pb.authStore.clear();
}
