// Reutiliza el esquema inicial sin ejecutar restauraciones ni borrar colecciones.
import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { runInNewContext } from "node:vm";
import PocketBase from "pocketbase";

const target = process.argv[2];
if (!target || new URL(target).protocol !== "https:")
  throw new Error("Indicar explícitamente la URL HTTPS de PocketBase.");
const pb = new PocketBase(target);
pb.autoCancellation(false);
try {
  await pb.collection("_superusers").authWithPassword(
    process.env.POCKETBASE_SUPERUSER_EMAIL,
    process.env.POCKETBASE_SUPERUSER_PASSWORD,
  );
  const existing = await pb.collections.getFullList();
  const schemas = new Map(existing.map((c) => [c.name, c]));
  const pending = [];
  const records = [];
  class Schema {
    constructor(data) {
      Object.assign(this, data);
      this.id = randomBytes(8).toString("hex").slice(0, 15);
    }
  }
  class Seed {
    constructor(collection) { this.collection = collection; this.data = {}; }
    set(key, value) { this.data[key] = value; }
  }
  const app = {
    findCollectionByNameOrId(name) {
      const c = schemas.get(name);
      if (!c) throw new Error("Missing collection");
      return c;
    },
    findRecordById() { throw new Error("Seed checked through API below"); },
    save(value) {
      if (value instanceof Seed) records.push(value);
      else { schemas.set(value.name, value); pending.push(value); }
    },
  };
  const source = await readFile(new URL("../pocketbase/pb_migrations/1791970000_factory.js", import.meta.url), "utf8");
  runInNewContext(source, {
    Collection: Schema, Record: Seed, migrate: (up) => up(app),
  }, { timeout: 1000 });
  if (pending.length) await pb.collections.import(pending, false);
  for (const seed of records) {
    try { await pb.collection(seed.collection.name).getOne(seed.data.id); }
    catch (error) {
      if (error.status !== 404) throw error;
      await pb.collection(seed.collection.name).create(seed.data);
    }
  }
  for (const name of ["staff", "news", "reels", "banners", "institutional_pages", "collections", "products", "orders", "site_settings"]) {
    const c = await pb.collections.getOne(name);
    const result = await pb.collection(name).getList(1, 1);
    console.log(`${c.name}: ${result.totalItems} registros`);
  }
  console.log(`Estructura verificada. Colecciones nuevas: ${pending.length}.`);
} catch (error) {
  console.error("No se pudo completar la preparación:", error.status || "", error.response?.message || "Error de configuración o conexión");
  // Los errores de validación no contienen los valores de las credenciales.
  if (error.response?.data) console.error(JSON.stringify(error.response.data));
  process.exitCode = 1;
} finally { pb.authStore.clear(); }
