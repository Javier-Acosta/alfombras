import { definitions } from "./admin-fields";
import { sanitizeRichText } from "./rich-text";
import { defaultSettings, safeWebUrl, validWhatsapp } from "./settings-values";

export async function validateImage(file: File, limit = 5242880) {
  if (file.size > limit)
    throw new Error(`La imagen supera el límite de ${limit / 1048576} MB.`);
  const b = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const png =
    b[0] === 137 &&
    b[1] === 80 &&
    b[2] === 78 &&
    b[3] === 71 &&
    b[4] === 13 &&
    b[5] === 10 &&
    b[6] === 26 &&
    b[7] === 10;
  const jpeg = b[0] === 255 && b[1] === 216 && b[2] === 255;
  const webp =
    String.fromCharCode(...b.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...b.slice(8, 12)) === "WEBP";
  if (!(
    (png && file.type === "image/png") ||
    (jpeg && file.type === "image/jpeg") ||
    (webp && file.type === "image/webp")
  ))
    throw new Error("Usá una imagen PNG, JPEG o WebP válida.");
}
export async function editableForm(collection: string, source: FormData) {
  const out = new FormData();
  for (const field of definitions[collection]) {
    const value = source.get(field.name);
    if (value === null) continue;
    if (field.type === "file") {
      if (value instanceof File && value.size) {
        await validateImage(
          value,
          collection === "banners" ? 10485760 : 5242880,
        );
        out.set(field.name, value);
      }
      continue;
    }
    if (typeof value !== "string") throw new Error("Campo inválido.");
    if (value.length > 100000)
      throw new Error("El texto supera el límite permitido.");
    if (field.required && !value.trim())
      throw new Error(`Completá ${field.label.toLowerCase()}.`);
    if (field.type === "checkbox") {
      out.set(field.name, String(value === "true"));
      continue;
    }
    if (field.type === "date" && value) {
      const d = new Date(`${value.slice(0, 10)}T00:00:00Z`);
      if (
        Number.isNaN(d.getTime()) ||
        d.toISOString().slice(0, 10) !== value.slice(0, 10)
      )
        throw new Error("Fecha inválida.");
      out.set(field.name, d.toISOString());
      continue;
    }
    if (
      field.type === "number" &&
      (!Number.isSafeInteger(Number(value)) ||
        Number(value) < 1 ||
        Number(value) > 100000000000)
    )
      throw new Error("El precio debe ser un entero positivo en centavos.");
    if (field.name === "key" && !["factory", "process"].includes(value))
      throw new Error("Sección inválida.");
    if (field.name === "collection" && value && !/^[a-z0-9]{15}$/.test(value))
      throw new Error("Colección inválida.");
    if (
      field.type === "url" &&
      (!safeWebUrl(value) ||
        !/^https:\/\/(www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?(?:\?.*)?$/.test(
          value,
        ))
    )
      throw new Error("Ingresá el enlace HTTPS de un reel de Instagram.");
    out.set(
      field.name,
      field.name === "content" ? sanitizeRichText(value) : value.trim(),
    );
  }
  if (collection === "products") out.set("currency", "ARS");
  if (source.has("published"))
    out.set("published", String(source.get("published") === "true"));
  if (source.has("priority")) {
    const p = Number(source.get("priority"));
    if (!Number.isInteger(p) || p < 0 || p > 9999)
      throw new Error("La prioridad debe estar entre 0 y 9999.");
    out.set("priority", String(p));
  }
  return out;
}
export async function settingsForm(source: FormData) {
  const out = new FormData();
  for (const key of Object.keys(defaultSettings)) {
    const v = source.get(key);
    if (v === null) continue;
    if (key === "logo") {
      if (v instanceof File && v.size) {
        await validateImage(v);
        out.set(key, v);
      }
      continue;
    }
    if (
      typeof v !== "string" ||
      v.length > (key === "address" ? 2000 : key === "hours" ? 1000 : 350)
    )
      throw new Error("Revisá la longitud de los campos.");
    if (key === "site_name" && !v.trim())
      throw new Error("Completá el nombre del sitio.");
    if (key.endsWith("_color") && !/^#[0-9a-f]{6}$/i.test(v))
      throw new Error("Color inválido.");
    if (key.endsWith("_url") && v && !safeWebUrl(v))
      throw new Error("Los enlaces deben comenzar con https://.");
    if (key === "whatsapp" && v && !validWhatsapp(v))
      throw new Error(
        "WhatsApp debe tener código de país, solo dígitos (8 a 15), sin + ni espacios.",
      );
    out.set(key, v.trim());
  }
  if (source.get("remove_logo") === "true" && !out.has("logo"))
    out.set("logo", "");
  return out;
}
