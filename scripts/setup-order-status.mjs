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
  const field = collection.fields.find((f) => f.name === "status");
  if (!field || field.type !== "select" || field.maxSelect !== 1)
    throw new Error("Campo status incompatible.");
  const values = ["pending", "confirmed", "delivered", "cancelled"];
  if (values.some((value) => !field.values.includes(value))) {
    await pb.collections.update(collection.id, {
      fields: collection.fields.map((f) =>
        f.name === "status"
          ? { ...f, values: [...new Set([...field.values, ...values])] }
          : f,
      ),
    });
  }
  const saved = await pb.collections.getOne("orders");
  if (
    !values.every((value) =>
      saved.fields.find((f) => f.name === "status").values.includes(value),
    )
  )
    throw new Error("No se pudo verificar la configuración.");
  console.log(
    "Estados de pedidos habilitados; registros y permisos conservados.",
  );
} catch (error) {
  console.error(
    "Error al preparar estados:",
    error.response?.message || error.message,
  );
  process.exitCode = 1;
} finally {
  pb.authStore.clear();
}
