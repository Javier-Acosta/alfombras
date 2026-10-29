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
  let collection;
  try {
    collection = await pb.collections.getOne("home_mosaic");
  } catch (error) {
    if (error.status !== 404) throw error;
    const products = await pb.collections.getOne("products");
    const staff = "@request.auth.collectionName = 'staff'";
    collection = await pb.collections.create({
      name: "home_mosaic",
      type: "base",
      listRule: `enabled = true || (${staff})`,
      viewRule: `enabled = true || (${staff})`,
      createRule: null,
      updateRule: staff,
      deleteRule: null,
      fields: [
        { name: "title", type: "text", required: true, max: 80 },
        { name: "enabled", type: "bool" },
        {
          name: "products",
          type: "relation",
          collectionId: products.id,
          maxSelect: 5,
          cascadeDelete: false,
        },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    });
  }
  if (
    collection.type !== "base" ||
    !collection.fields.some(
      (f) =>
        f.name === "products" && f.type === "relation" && f.maxSelect === 5,
    )
  )
    throw new Error(
      "La colección existente no coincide con el esquema del mosaico.",
    );
  try {
    await pb.collection("home_mosaic").getOne("mosaicconfig001");
  } catch (error) {
    if (error.status !== 404) throw error;
    await pb.collection("home_mosaic").create({
      id: "mosaicconfig001",
      title: "Piezas destacadas",
      enabled: false,
      products: [],
    });
  }
  console.log(
    "Mosaico preparado. Se conserva la configuración existente; no se publicaron ni seleccionaron productos automáticamente.",
  );
} catch (error) {
  console.error(
    "No se pudo preparar el mosaico:",
    error.response?.message || error.message,
  );
  process.exitCode = 1;
} finally {
  pb.authStore.clear();
}
