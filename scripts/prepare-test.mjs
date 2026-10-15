// Entorno descartable: jamás lee .env.local ni usa una base remota.
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import PocketBase from "pocketbase";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
const root = new URL("../", import.meta.url);
const dir = new URL("../.test-runtime/", import.meta.url);
await mkdir(dir, { recursive: true });
let saved = {};
try {
  saved = parseEnv(await readFile(new URL(".env.test", dir), "utf8"));
} catch {
  /* primera ejecución */
}
const password =
  saved.POCKETBASE_SUPERUSER_PASSWORD || randomBytes(24).toString("hex");
const email = "smoke-admin@example.test";
execFileSync(
  fileURLToPath(new URL("pocketbase.exe", dir)),
  ["superuser", "upsert", email, password, "--dir=.test-runtime/pb_data"],
  { cwd: root, stdio: "pipe" },
);
const env = `POCKETBASE_URL=http://127.0.0.1:8097\nNEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8097\nPOCKETBASE_SUPERUSER_EMAIL=${email}\nPOCKETBASE_SUPERUSER_PASSWORD=${password}\nNEXT_PUBLIC_APP_URL=http://localhost:3217\nSTAFF_EMAIL=staff@example.test\nSTAFF_PASSWORD=${saved.STAFF_PASSWORD || randomBytes(24).toString("hex")}\n`;
await writeFile(new URL(".env.test", dir), env);
Object.assign(process.env, parseEnv(env));
await import("./create-staff.mjs");
const pb = new PocketBase("http://127.0.0.1:8097");
await pb.collection("_superusers").authWithPassword(email, password);
await pb
  .collection("site_settings")
  .update("alfombrasconfig", { whatsapp: "5493834000000" });
try {
  const previous = JSON.parse(
    await readFile(new URL("fixtures.json", dir), "utf8"),
  );
  await pb.collection("products").getOne(previous.product);
  console.log("Los datos sintéticos ya existen; no se duplicaron.");
  process.exit(0);
} catch {
  /* generar fixtures si no existen */
}
// Imágenes sintéticas exclusivas para comprobar composición, nunca para publicación.
const sharp = (await import("sharp")).default;
const svg = `<svg width="900" height="650" xmlns="http://www.w3.org/2000/svg"><rect width="900" height="650" fill="#f7efe1"/><rect x="125" y="60" width="650" height="530" rx="4" fill="#aa613d"/><rect x="150" y="85" width="600" height="480" fill="#dec59c" stroke="#734c35" stroke-width="15"/><path d="M450 130 690 325 450 520 210 325Z" fill="#a15e3d"/><path d="M450 210 590 325 450 440 310 325Z" fill="#f1e2bc"/><path d="M100 60h700M100 590h700" stroke="#b59c74" stroke-width="20" stroke-dasharray="5 8"/><text x="450" y="630" text-anchor="middle" font-size="18" fill="#6a5840">IMAGEN SINTÉTICA · PRUEBA LOCAL</text></svg>`;
await sharp(Buffer.from(svg))
  .png()
  .toFile(fileURLToPath(new URL("sample.png", dir)));
const buffer = await readFile(new URL("sample.png", dir));
function form(values) {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, String(v));
  f.set("image", new File([buffer], "prueba-local.png", { type: "image/png" }));
  return f;
}
const collection = await pb.collection("collections").create(
  form({
    name: "Colección de prueba",
    description: "Contenido sintético exclusivo del entorno de verificación.",
    published: true,
    priority: 1,
  }),
);
const product = await pb.collection("products").create(
  form({
    name: "Alfombra de prueba",
    description:
      "Pieza de ejemplo para verificar la tienda. No es un producto real.",
    priceMinor: 15000000,
    currency: "ARS",
    published: true,
    priority: 1,
    measurements: "1,50 × 2,00 m",
    materials: "Material de prueba",
    collection: collection.id,
  }),
);
const sold = await pb.collection("products").create(
  form({
    name: "Alfombra vendida de prueba",
    description: "Producto de prueba marcado como vendido.",
    priceMinor: 9000000,
    currency: "ARS",
    published: true,
    sold: true,
    collection: collection.id,
  }),
);
const draft = await pb.collection("products").create(
  form({
    name: "Borrador privado",
    description: "Este registro no debe aparecer al público.",
    priceMinor: 5000000,
    currency: "ARS",
    published: false,
  }),
);
const news = [];
for (let i = 0; i < 7; i++)
  news.push(
    await pb.collection("news").create(
      form({
        title: `Noticia de prueba ${i + 1}`,
        summary: "Resumen de prueba para verificar las tarjetas de noticias.",
        content: "<p>Contenido de prueba del entorno local.</p>",
        published_on: "2026-10-14 00:00:00.000Z",
        published: true,
        priority: i,
      }),
    ),
  );
await pb
  .collection("institutional_pages")
  .create({
    key: "factory",
    title: "La fábrica",
    content: "<p>Contenido institucional de prueba local.</p>",
    published: true,
  })
  .catch(() => {});
await pb
  .collection("institutional_pages")
  .create({
    key: "process",
    title: "Proceso artesanal",
    content:
      "<p>Contenido de prueba para verificar la presentación del proceso.</p>",
    published: true,
  })
  .catch(() => {});
const fixture = {
  collection: collection.id,
  product: product.id,
  sold: sold.id,
  draft: draft.id,
  news: news.map((n) => n.id),
};
await writeFile(new URL("fixtures.json", dir), JSON.stringify(fixture));
console.log(
  "Entorno local de prueba preparado; credenciales guardadas solo en .test-runtime/.env.test.",
);
