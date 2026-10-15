import Link from "next/link";
import { getSiteSettings, safeWebUrl } from "@/lib/settings";
import { fileUrl } from "@/lib/pocketbase";
const links = [
  ["/", "Inicio"],
  ["/la-fabrica", "La fábrica"],
  ["/proceso-artesanal", "Proceso artesanal"],
  ["/colecciones", "Colecciones"],
  ["/noticias", "Noticias"],
  ["/tienda", "Tienda"],
  ["/#ubicacion", "Ubicación"],
];
export async function SiteHeader() {
  const s = await getSiteSettings();
  return (
    <header className="nav">
      <Link href="/" className="brand">
        {s.logo && s.id && s.collectionId ? (
          <img
            className="site-logo"
            src={fileUrl(s.collectionId, s.id, s.logo)}
            alt={s.site_name}
          />
        ) : (
          s.site_name
        )}
      </Link>
      <nav className="nav-links" aria-label="Navegación principal">
        {links.map(([href, label]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
      <details className="mobile-menu">
        <summary>Menú</summary>
        <nav aria-label="Navegación móvil">
          {links.map(([href, label]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
      </details>
    </header>
  );
}
export async function SiteFooter() {
  const s = await getSiteSettings();
  return (
    <footer>
      <strong>{s.site_name}</strong>
      <span>{s.footer_text}</span>
      <div className="social-links">
        {[
          ["Instagram", s.instagram_url],
          ["Facebook", s.facebook_url],
          ["YouTube", s.youtube_url],
        ].map(([label, url]) =>
          safeWebUrl(url) ? (
            <a
              key={label}
              href={safeWebUrl(url)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {label} ↗
            </a>
          ) : null,
        )}
        <Link href="/admin">Administración</Link>
      </div>
    </footer>
  );
}
