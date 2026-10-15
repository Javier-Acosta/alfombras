"use client";
import { useEffect, useState, type FormEvent } from "react";
import {
  defaultSettings,
  validWhatsapp,
  type SiteSettings,
} from "@/lib/settings-values";
const labels: Record<string, string> = {
  site_name: "Nombre del sitio",
  description: "Descripción",
  footer_text: "Pie de página",
  address: "Dirección",
  hours: "Horarios",
  map_url: "Enlace HTTPS a ubicación",
  whatsapp: "WhatsApp comercial (código de país y número, sin +)",
  instagram_url: "Instagram",
  facebook_url: "Facebook",
  youtube_url: "YouTube",
  accent_color: "Color destacado",
  background_color: "Fondo general",
  surface_color: "Superficies",
  news_color: "Fondo de noticias",
  text_color: "Texto",
};
export function SiteSettingsForm() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void fetch("/api/admin/settings", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("No pudimos cargar la configuración.");
        return r.json();
      })
      .then((d) => setSettings({ ...defaultSettings, ...d }))
      .catch((e) => setError(e.message));
  }, []);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/admin/settings", {
        method: "PATCH",
        body: data,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setSettings({ ...defaultSettings, ...d });
      setMessage(
        "Configuración guardada. Los cambios aparecen al recargar el sitio.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <p className="eyebrow orange">IDENTIDAD Y DATOS DE LA FÁBRICA</p>
      <h1>Configuración</h1>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="manager-message" role="status">
          {message}
        </p>
      )}
      {settings ? (
        <form className="content-form" onSubmit={save}>
          <fieldset className="editor-fields" disabled={busy}>
            {Object.keys(defaultSettings)
              .filter((k) => k !== "logo")
              .map((key) => (
                <label key={key}>
                  {labels[key]}
                  {["description", "footer_text", "address", "hours"].includes(
                    key,
                  ) ? (
                    <textarea
                      name={key}
                      value={settings[key as keyof typeof defaultSettings]}
                      onChange={(e) =>
                        setSettings({ ...settings, [key]: e.target.value })
                      }
                    />
                  ) : (
                    <input
                      name={key}
                      type={
                        key.endsWith("_color")
                          ? "color"
                          : key.endsWith("_url")
                            ? "url"
                            : "text"
                      }
                      required={key === "site_name"}
                      value={settings[key as keyof typeof defaultSettings]}
                      onChange={(e) =>
                        setSettings({ ...settings, [key]: e.target.value })
                      }
                    />
                  )}
                </label>
              ))}
            {!validWhatsapp(settings.whatsapp) && (
              <p>
                Los pedidos están deshabilitados hasta configurar un número
                válido.
              </p>
            )}
            <label>
              Logo (PNG, JPEG o WebP; hasta 5 MB)
              <input
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
              />
            </label>
            <label className="check">
              <input type="checkbox" name="remove_logo" value="true" />
              Quitar logo actual
            </label>
            <button>{busy ? "Guardando…" : "Guardar configuración"}</button>
          </fieldset>
        </form>
      ) : (
        <p>Cargando configuración…</p>
      )}
    </>
  );
}
