export const MOSAIC_ID = "mosaicconfig001";
export const MOSAIC_LIMIT = 9;
export type MosaicConfig = { title: string; enabled: boolean };
export type MosaicItem = {
  id: string;
  imageUrl: string;
  target: string;
  label: string;
};
export function parseMosaic(value: unknown): MosaicConfig {
  if (!value || typeof value !== "object")
    throw new Error("Configuración inválida.");
  const v = value as Record<string, unknown>;
  if (
    Object.keys(v).some((k) => !["title", "enabled"].includes(k)) ||
    typeof v.title !== "string" ||
    !v.title.trim() ||
    v.title.trim().length > 80 ||
    typeof v.enabled !== "boolean"
  )
    throw new Error("Completá el título del mosaico (hasta 80 caracteres).");
  return { title: v.title.trim(), enabled: v.enabled };
}
