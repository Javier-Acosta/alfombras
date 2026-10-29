"use client";
import { useEffect, useState, type FormEvent } from "react";
import { AdminCollection } from "./admin-collection";
import type { MosaicConfig } from "@/lib/mosaic-values";
export function AdminMosaic() {
  const [config, setConfig] = useState<MosaicConfig | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void fetch("/api/admin/mosaic")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.message);
        setConfig(d.config);
      })
      .catch((e) => setError(e.message));
  }, []);
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/admin/mosaic", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!r.ok) throw new Error((await r.json()).message);
      setMessage("Mosaico guardado.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1>Mosaico</h1>
      <p>
        Cargá hasta 9 fotos independientes de Tienda. Cada foto abre la
        colección o el diseño que elijas y se muestra sin títulos ni
        descripciones. La prioridad más alta aparece primero.
      </p>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {config && (
        <form className="content-form" onSubmit={save}>
          <fieldset disabled={busy} className="editor-fields">
            <label>
              Título de la sección
              <input
                required
                maxLength={80}
                value={config.title}
                onChange={(e) =>
                  setConfig({ ...config, title: e.target.value })
                }
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) =>
                  setConfig({ ...config, enabled: e.target.checked })
                }
              />
              Mostrar mosaico en el Home
            </label>
            <button>{busy ? "Guardando…" : "Guardar mosaico"}</button>
          </fieldset>
        </form>
      )}
      <AdminCollection collection="mosaic_tiles" />
      <p>
        <a href="/#piezas-destacadas" target="_blank" rel="noreferrer">
          Ver mosaico en el Home ↗
        </a>
      </p>
    </>
  );
}
