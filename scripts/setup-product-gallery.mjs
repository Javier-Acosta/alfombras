import PocketBase from "pocketbase";
const target = process.argv[2];
if (
  !target ||
  new URL(target).origin !== new URL(process.env.POCKETBASE_URL).origin
)
  throw new Error(
    "Indicar explícitamente la instancia configurada de PocketBase.",
  );
const pb = new PocketBase(target);
try {
  await pb
    .collection("_superusers")
    .authWithPassword(
      process.env.POCKETBASE_SUPERUSER_EMAIL,
      process.env.POCKETBASE_SUPERUSER_PASSWORD,
    );
  const collection = await pb.collections.getOne("products");
  const existing = collection.fields.find((f) => f.name === "gallery");
  if (existing && (existing.type !== "file" || existing.maxSelect !== 10))
    throw new Error("El campo existente tiene otra estructura.");
  if (!existing)
    await pb.collections.update(collection.id, {
      fields: [
        ...collection.fields,
        {
          name: "gallery",
          type: "file",
          maxSelect: 10,
          maxSize: 5242880,
          mimeTypes: ["image/jpeg", "image/png", "image/webp"],
          thumbs: ["160x160"],
          protected: false,
        },
      ],
    });
  console.log(
    "Galería preparada. Se conservaron las imágenes y productos existentes.",
  );
} catch (error) {
  console.error(error.response?.message || error.message);
  process.exitCode = 1;
} finally {
  pb.authStore.clear();
}
