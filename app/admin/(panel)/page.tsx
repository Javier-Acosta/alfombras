import Link from "next/link";
import { collectionLabels } from "@/lib/admin-fields";
import { getSiteSettings } from "@/lib/settings";
import { validWhatsapp } from "@/lib/settings-values";
export default async function Page() {
  const s = await getSiteSettings();
  return (
    <>
      <p className="eyebrow orange">PANEL DE CONTENIDO</p>
      <h1>Administración</h1>
      <p>
        Publicá novedades, organizá las colecciones y gestioná las alfombras.
      </p>
      {!validWhatsapp(s.whatsapp) && (
        <p className="manager-message">
          Falta configurar el WhatsApp comercial. Los pedidos están
          deshabilitados.{" "}
          <Link href="/admin/settings">Ir a configuración →</Link>
        </p>
      )}
      <div className="module-grid">
        {Object.entries({
          ...collectionLabels,
          pedidos: "Pedidos",
          settings: "Configuración",
        }).map(([k, v]) => (
          <Link key={k} href={`/admin/${k}`}>
            <strong>{v}</strong>
            <span>
              {k === "pedidos"
                ? "Consultar pedidos pendientes"
                : "Editar y administrar"}
            </span>
            <b>Abrir →</b>
          </Link>
        ))}
      </div>
    </>
  );
}
