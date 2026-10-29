import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/admin";
import { collectionLabels } from "@/lib/admin-fields";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await getAdminClient())) redirect("/admin/login");
  return (
    <div className="admin-shell">
      <aside>
        <Link className="brand" href="/admin">
          ALFOMBRAS
          <br />
          CATAMARCA
        </Link>
        <p>Administración</p>
        {Object.entries(collectionLabels).map(([k, v]) => (
          <Link key={k} href={`/admin/${k}`}>
            {v}
          </Link>
        ))}
        <Link href="/admin/mosaico">Mosaico</Link>
        <Link href="/admin/pedidos">Pedidos</Link>
        <Link href="/admin/settings">Configuración</Link>
        <Link href="/">Ver sitio ↗</Link>
        <form action="/api/auth/logout" method="post">
          <button>Cerrar sesión</button>
        </form>
      </aside>
      <section id="contenido">{children}</section>
    </div>
  );
}
