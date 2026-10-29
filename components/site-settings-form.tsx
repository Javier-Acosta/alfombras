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
  whatsapp: "WhatsApp de contacto y pedidos (código de país y número, sin +)",
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
                  ) : key.endsWith("_color") ? (
                    <>
                      <span className="settings-color-control">
                        <input
                          type="color"
                          name={key}
                          aria-label={labels[key]}
                          value={settings[key as keyof typeof defaultSettings]}
                          onChange={(e) =>
                            setSettings({ ...settings, [key]: e.target.value })
                          }
                        />
                        <code>
                          {settings[
                            key as keyof typeof defaultSettings
                          ].toUpperCase()}
                        </code>
                      </span>
                      {key === "accent_color" && (
                        <span className="settings-color-help">
                          Color de los textos y enlaces destacados, como
                          “Conocer colección” y “Leer noticia”. También se
                          aplica a los detalles destacados de la tienda.
                        </span>
                      )}
                    </>
                  ) : (
                    <input
                      name={key}
                      type={
                        key === "whatsapp"
                          ? "tel"
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
                  {key === "whatsapp" && (
                    <span className="settings-color-help">
                      Este número recibe los pedidos y las consultas del botón
                      Contacto, debajo de Ver ubicación en el inicio. Usá solo
                      dígitos, sin espacios ni guiones. El mensaje de contacto
                      es: “Hola, me gustaría contactarme con la Fábrica de
                      Alfombras - Catamarca. Gracias”.
                    </span>
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
