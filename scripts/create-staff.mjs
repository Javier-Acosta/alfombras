import PocketBase from "pocketbase";
if (process.env.ENV_FILE) process.loadEnvFile(process.env.ENV_FILE);
const {
  POCKETBASE_URL,
  POCKETBASE_SUPERUSER_EMAIL,
  POCKETBASE_SUPERUSER_PASSWORD,
  STAFF_EMAIL,
  STAFF_PASSWORD,
} = process.env;
if (
  !POCKETBASE_URL ||
  !POCKETBASE_SUPERUSER_EMAIL ||
  !POCKETBASE_SUPERUSER_PASSWORD ||
  !STAFF_EMAIL ||
  !STAFF_PASSWORD
)
  throw new Error(
    "Configurar variables de PocketBase y STAFF_EMAIL/STAFF_PASSWORD por entorno.",
  );
if (STAFF_PASSWORD.length < 12)
  throw new Error("La contraseña debe tener al menos 12 caracteres.");
const pb = new PocketBase(POCKETBASE_URL);
await pb
  .collection("_superusers")
  .authWithPassword(POCKETBASE_SUPERUSER_EMAIL, POCKETBASE_SUPERUSER_PASSWORD);
const found = await pb.collection("staff").getList(1, 1, {
  filter: pb.filter("email = {:email}", { email: STAFF_EMAIL }),
});
if (found.items.length)
  console.log("El usuario ya existe. No se modificó su contraseña.");
else {
  await pb.collection("staff").create({
    email: STAFF_EMAIL,
    password: STAFF_PASSWORD,
    passwordConfirm: STAFF_PASSWORD,
  });
  console.log("Administrador creado.");
}
