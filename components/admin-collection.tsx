"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { definitions, collectionLabels } from "@/lib/admin-fields";
import { ContentPreview, type ContentRecord } from "./content-preview";
async function json(r: Response) {
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || "No se pudo completar la operación.");
  return d;
}
export function AdminCollection({ collection }: { collection: string }) {
  const [records, setRecords] = useState<ContentRecord[]>([]);
  const [editing, setEditing] = useState<ContentRecord | null>(null);
  const [preview, setPreview] = useState<ContentRecord | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      setRecords(
        await json(
          await fetch(`/api/admin/${collection}`, { cache: "no-store" }),
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [collection]);
  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, [load]);
  async function action(r: ContentRecord, duplicate = false) {
    if (!duplicate && !confirm("¿Eliminar este contenido?")) return;
    setBusy(true);
    setError("");
    try {
      await json(
        await fetch(
          `/api/admin/${collection}/${r.id}${duplicate ? "/duplicate" : ""}`,
          { method: duplicate ? "POST" : "DELETE" },
        ),
      );
      await load();
      setMessage(
        duplicate ? "Copia creada como borrador." : "Contenido eliminado.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo completar la operación.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="manager-title">
        <h1>
          {collection === "products"
            ? "Productos de la tienda"
            : collectionLabels[collection]}
        </h1>
        <button
          className="secondary"
          onClick={() => {
            setEditing({ id: "" });
            setPreview(null);
          }}
        >
          + Nuevo
        </button>
      </div>
      <p>Guardá como borrador para revisar antes de publicar.</p>
      {loading && <p>Cargando…</p>}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="manager-message">
          {message}
        </p>
      )}
      {editing && (
        <Editor
          key={editing.id}
          collection={collection}
          record={editing}
          onCancel={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
            setMessage("Contenido guardado.");
          }}
        />
      )}
      {preview && (
        <section className="preview-panel">
          <button onClick={() => setPreview(null)}>Cerrar vista previa</button>
          <ContentPreview record={preview} />
        </section>
      )}
      {!loading && !records.length && (
        <p className="empty">
          Todavía no hay contenido. Usá “+ Nuevo” para empezar.
        </p>
      )}
      <div className="record-list">
        {records.map((r) => (
          <article key={r.id}>
            <div>
              <span className={r.published ? "status published" : "status"}>
                {r.published ? "Publicado" : "Borrador"} · Prioridad{" "}
                {r.priority || 0}
                {r.sold ? " · Vendido" : ""}
              </span>
              <h3>{r.title || r.name}</h3>
            </div>
            <div className="record-actions">
              <button disabled={busy} onClick={() => setPreview(r)}>
                Vista previa
              </button>
              <button disabled={busy} onClick={() => setEditing(r)}>
                Editar
              </button>
              {collection !== "institutional_pages" && (
                <button disabled={busy} onClick={() => void action(r, true)}>
                  Duplicar
                </button>
              )}
              <button disabled={busy} onClick={() => void action(r)}>
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
function Editor({
  collection,
  record,
  onCancel,
  onSaved,
}: {
  collection: string;
  record: ContentRecord;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const fields = definitions[collection];
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields
        .filter((f) => f.type !== "file")
        .map((f) => [
          f.name,
          f.type === "date"
            ? String(record[f.name] || "").slice(0, 10)
            : String(record[f.name] ?? (f.type === "checkbox" ? "false" : "")),
        ]),
    ),
  );
  const [published, setPublished] = useState(Boolean(record.published));
  const [priority, setPriority] = useState(Number(record.priority || 0));
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState("");
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [collections, setCollections] = useState<ContentRecord[]>([]);
  useEffect(() => {
    if (collection === "products")
      void fetch("/api/admin/collections")
        .then(json)
        .then(setCollections)
        .catch(() => setError("No se pudieron cargar las colecciones."));
  }, [collection]);
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    // Object URL follows the selected file and is revoked on cleanup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImage(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const set = (key: string, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = new FormData();
      Object.entries(values).forEach(([k, v]) => data.set(k, v));
      data.set("published", String(published));
      data.set("priority", String(priority));
      if (file) data.set("image", file);
      await json(
        await fetch(
          `/api/admin/${collection}${record.id ? `/${record.id}` : ""}`,
          { method: record.id ? "PATCH" : "POST", body: data },
        ),
      );
      await onSaved();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo guardar. Tu contenido permanece en el formulario.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="content-form" onSubmit={save}>
      <h2>{record.id ? "Editar contenido" : "Nuevo contenido"}</h2>
      <fieldset className="editor-fields" disabled={busy}>
        {fields.map((f) => (
          <label
            key={f.name}
            className={f.type === "checkbox" ? "check" : undefined}
          >
            {f.type === "checkbox" && (
              <input
                type="checkbox"
                checked={values[f.name] === "true"}
                onChange={(e) => set(f.name, String(e.target.checked))}
              />
            )}
            <span>{f.label}</span>
            {f.type === "checkbox" ? null : f.type === "textarea" ? (
              <>
                <textarea
                  value={values[f.name]}
                  required={f.required}
                  onChange={(e) => set(f.name, e.target.value)}
                />
                {f.name === "content" && (
                  <small className="field-help">
                    Párrafos separados por una línea en blanco o HTML básico (p,
                    strong, em, listas, enlaces).
                  </small>
                )}
              </>
            ) : f.type === "file" ? (
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                required={f.required && !record.image}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            ) : f.type === "collection" ? (
              <select
                value={values[f.name]}
                onChange={(e) => set(f.name, e.target.value)}
              >
                <option value="">Sin colección</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {!c.published ? " (borrador)" : ""}
                  </option>
                ))}
              </select>
            ) : f.type === "pagekey" ? (
              <select
                required
                value={values[f.name]}
                onChange={(e) => set(f.name, e.target.value)}
              >
                <option value="">Seleccionar</option>
                <option value="factory">La fábrica</option>
                <option value="process">Proceso artesanal</option>
              </select>
            ) : (
              <input
                type={f.type}
                value={values[f.name]}
                required={f.required}
                min={f.type === "number" ? 1 : undefined}
                step={f.type === "number" ? 1 : undefined}
                onChange={(e) => set(f.name, e.target.value)}
              />
            )}
          </label>
        ))}
        <label>
          Prioridad (mayor primero)
          <input
            type="number"
            min="0"
            max="9999"
            step="1"
            value={priority}
            required
            onChange={(e) => setPriority(Number(e.target.value))}
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          Publicar en el sitio
        </label>
      </fieldset>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button disabled={busy}>
          {busy
            ? "Guardando…"
            : published
              ? "Guardar y publicar"
              : "Guardar borrador"}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => setPreview((v) => !v)}
        >
          Vista previa
        </button>
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
      {preview && (
        <ContentPreview
          record={{
            ...record,
            ...values,
            published,
            sold: values.sold === "true",
          }}
          image={image}
        />
      )}
    </form>
  );
}
