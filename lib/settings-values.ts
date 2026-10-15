export const SETTINGS_ID = "alfombrasconfig";
export const defaultSettings = {
  site_name: "Fábrica de Alfombras Catamarca",
  description:
    "La fábrica, el proceso artesanal y las colecciones de alfombras de Catamarca.",
  footer_text: "Fábrica de Alfombras Catamarca",
  accent_color: "#ED8023",
  background_color: "#f7f4ee",
  surface_color: "#ffffff",
  news_color: "#f0d9e9",
  text_color: "#101128",
  address: "",
  hours: "",
  map_url: "",
  whatsapp: "",
  instagram_url: "",
  facebook_url: "",
  youtube_url: "",
  logo: "",
};
export type SiteSettings = typeof defaultSettings & {
  id?: string;
  collectionId?: string;
};
export function safeWebUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password
      ? u.href
      : undefined;
  } catch {
    return undefined;
  }
}
export function validWhatsapp(value: string) {
  return /^[1-9]\d{7,14}$/.test(value);
}
