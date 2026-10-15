"use client";
import { fileUrl } from "@/lib/pocketbase";
import { useEffect, useState } from "react";
export type ContentRecord = Record<string, unknown> & {
  id: string;
  collectionId?: string;
  name?: string;
  title?: string;
  published?: boolean;
  priority?: number;
  image?: string;
};
export function ContentPreview({
  record,
  image,
}: {
  record: ContentRecord;
  image?: string;
}) {
  const src =
    image || fileUrl(record.collectionId || "", record.id, record.image);
  const content = String(record.content || "");
  const [html, setHtml] = useState("");
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    void fetch("/api/admin/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        if (active) {
          setHtml(d.html);
          setError(false);
        }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [content]);
  return (
    <article className="content-preview">
      <small>
        VISTA PREVIA · {record.published ? "PUBLICADO" : "BORRADOR"}
      </small>
      <h2>{record.title || record.name}</h2>
      {src && (
        <img
          src={src}
          alt={record.title || record.name || "Imagen seleccionada"}
        />
      )}
      <p className="preview-text">
        {String(record.summary || record.description || "")}
      </p>
      {error ? (
        <p role="alert">
          No se pudo cargar la vista previa. El texto permanece en el
          formulario.
        </p>
      ) : (
        <div className="news-body" dangerouslySetInnerHTML={{ __html: html }} />
      )}
      {record.priceMinor !== undefined && (
        <p>
          {new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
          }).format(Number(record.priceMinor) / 100)}
          {record.sold ? " · Vendido" : ""}
        </p>
      )}
    </article>
  );
}
