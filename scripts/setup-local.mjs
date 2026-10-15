// Prepara únicamente esta carpeta y una base de desarrollo en loopback.
import { access, mkdir, writeFile } from "node:fs/promises";
import { execFileSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import PocketBase from "pocketbase";
const root = new URL("../", import.meta.url);
try {
  await access(new URL(".env.local", root));
  console.log(
    "Ya existe .env.local; se conserva la configuración. No se realizaron cambios.",
  );
  process.exit(0);
} catch {
  /* primera preparación */
}
const probe = createServer();
await new Promise((resolve, reject) => {
  probe.once("error", reject);
  probe.listen(8090, "127.0.0.1", () => probe.close(resolve));
});
const binary = fileURLToPath(new URL("pocketbase/pocketbase.exe", root));
await access(binary);
execFileSync(
  binary,
  [
    "migrate",
    "up",
    "--dir=pocketbase/pb_data",
    "--migrationsDir=pocketbase/pb_migrations",
  ],
  { cwd: root, stdio: "pipe" },
);
const password = randomBytes(24).toString("hex");
const staffPassword = randomBytes(18).toString("hex");
const admin = "admin@alfombras.local";
const staff = "personal@alfombras.local";
execFileSync(
  binary,
  ["superuser", "upsert", admin, password, "--dir=pocketbase/pb_data"],
  { cwd: root, stdio: "pipe" },
);
const service = spawn(
  binary,
  [
    "serve",
    "--http=127.0.0.1:8090",
    "--dir=pocketbase/pb_data",
    "--migrationsDir=pocketbase/pb_migrations",
  ],
  { cwd: root, stdio: "ignore", windowsHide: true, detached: true },
);
service.unref();
const pb = new PocketBase("http://127.0.0.1:8090");
let ready = false;
for (let i = 0; i < 30; i++) {
  try {
    await pb.health.check();
    ready = true;
    break;
  } catch {
    await new Promise((r) => setTimeout(r, 250));
  }
}
if (!ready) throw new Error("No se pudo iniciar PocketBase local.");
await pb.collection("_superusers").authWithPassword(admin, password);
await pb
  .collection("staff")
  .create({
    email: staff,
    password: staffPassword,
    passwordConfirm: staffPassword,
    name: "Administración local",
  });
await writeFile(
  new URL(".env.local", root),
  `POCKETBASE_URL=http://127.0.0.1:8090\nNEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090\nPOCKETBASE_SUPERUSER_EMAIL=${admin}\nPOCKETBASE_SUPERUSER_PASSWORD=${password}\nNEXT_PUBLIC_APP_URL=http://localhost:3000\n`,
  { mode: 0o600, flag: "wx" },
);
await mkdir(new URL(".local/", root), { recursive: true });
await writeFile(
  new URL(".local/acceso.txt", root),
  `Acceso de desarrollo local — Fábrica de Alfombras Catamarca\n\nPanel: http://localhost:3000/admin/login\nCorreo: ${staff}\nContraseña: ${staffPassword}\n\nPocketBase: http://127.0.0.1:8090/_/\nCorreo: ${admin}\nContraseña: ${password}\n\nEste archivo y .env.local están excluidos de Git. No compartir ni usar estas cuentas en producción.\n`,
  { mode: 0o600 },
);
console.log(
  "PocketBase local preparado sin productos ni contenido inventado. Acceso guardado en .local/acceso.txt; ejecutar npm run dev.",
);
