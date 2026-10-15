import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import PocketBase from "pocketbase";

const target = "https://fabricaalfombras-pocketbase-61e4c3-187-77-225-53.sslip.io";
if (new URL(process.env.POCKETBASE_URL).origin !== target)
  throw new Error("La configuración debe apuntar a la instancia de Alfombras.");
await mkdir(new URL("../.local/", import.meta.url), { recursive: true });
const privatePath = new URL("../.local/panel-access.json", import.meta.url);
let access;
try { access = JSON.parse(await readFile(privatePath, "utf8")); }
catch (error) {
  if (error.code !== "ENOENT") throw error;
  access = {
    email: process.env.STAFF_EMAIL || process.env.POCKETBASE_SUPERUSER_EMAIL,
    password: process.env.STAFF_PASSWORD || randomBytes(24).toString("base64url"),
    pocketbase: target,
  };
  await writeFile(privatePath, JSON.stringify(access, null, 2), { flag: "wx", mode: 0o600 });
}
if (access.pocketbase !== target) throw new Error("El acceso guardado corresponde a otra instancia.");
const pb = new PocketBase(target);
try {
  await pb.collection("_superusers").authWithPassword(process.env.POCKETBASE_SUPERUSER_EMAIL, process.env.POCKETBASE_SUPERUSER_PASSWORD);
  const found = await pb.collection("staff").getList(1, 1, { filter: pb.filter("email = {:email}", { email: access.email }) });
  if (!found.items.length) {
    await pb.collection("staff").create({ email: access.email, password: access.password, passwordConfirm: access.password, name: "Administración Alfombras" });
    console.log("Usuario administrador creado.");
  }
  pb.authStore.clear();
  await pb.collection("staff").authWithPassword(access.email, access.password);
  await pb.collection("staff").authRefresh();
  for (const name of ["products", "orders", "site_settings"]) await pb.collection(name).getList(1, 1);
  await writeFile(new URL("../.local/acceso-panel.txt", import.meta.url), `Panel de Alfombras\nURL: http://localhost:3000/admin/login\nCorreo: ${access.email}\nContraseña: ${access.password}\n\nCuenta de personal, independiente del superusuario de PocketBase.\n`, { mode: 0o600 });
  console.log("Autenticación y permisos de personal verificados. Acceso guardado en .local/acceso-panel.txt.");
} catch (error) {
  console.error("No se pudo preparar el acceso:", error.status || "", error.response?.message || "Revisar configuración");
  process.exitCode = 1;
} finally { pb.authStore.clear(); }
