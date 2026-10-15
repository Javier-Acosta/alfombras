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
  const collection = await pb.collections.getOne("orders");
  const field = collection.fields.find((f) => f.name === "archived");
  if (field && field.type !== "bool")
    throw new Error("Campo archived incompatible.");
  if (!field)
    await pb.collections.update(collection.id, {
      fields: [...collection.fields, { name: "archived", type: "bool" }],
    });
  const saved = await pb.collections.getOne("orders");
  if (!saved.fields.some((f) => f.name === "archived" && f.type === "bool"))
    throw new Error("No se pudo verificar el campo de archivo.");
  console.log(
    "Archivo de pedidos habilitado; registros y permisos conservados.",
  );
} catch (error) {
  console.error(
    "Error al preparar archivo de pedidos:",
    error.response?.message || error.message,
  );
  process.exitCode = 1;
} finally {
  pb.authStore.clear();
}
