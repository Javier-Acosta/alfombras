import Link from "next/link";
import { publicHome, fileUrl } from "@/lib/content";
import { getSiteSettings, safeWebUrl } from "@/lib/settings";
import { CollectionCards } from "@/components/content-cards";
import { HomeMosaic } from "@/components/home-mosaic";
import { validWhatsapp } from "@/lib/settings-values";
export default async function Home() {
  const [data, s] = await Promise.all([publicHome(), getSiteSettings()]);
  const banner = data.banners.items[0];
  return (
    <>
      {banner ? (
        <section id="inicio" className="home-banner">
          <h1 className="sr-only">{s.site_name}</h1>
          <img
            src={fileUrl(banner.collectionId, banner.id, banner.image)}
            alt={banner.title}
            fetchPriority="high"
          />
        </section>
      ) : (
        <section id="inicio" className="hero">
          <div className="hero-shape shape-pink" />
          <div className="hero-shape shape-red" />
          <div className="hero-shape shape-dark" />
          <p className="eyebrow">FÁBRICA DE ALFOMBRAS</p>
          <h1>
            ALFOMBRAS
            <br />
            <span>CATAMARCA</span>
          </h1>
          <p className="hero-copy">
            Conocé la fábrica, el proceso artesanal y nuestras colecciones.
          </p>
          <Link className="hero-cta" href="/tienda">
            Explorar la tienda →
          </Link>
        </section>
      )}
      <section className="section schedule-cta">
        <p className="eyebrow blue">LA FÁBRICA</p>
        <h2>
          Conocé nuestra fábrica
          <br />y el proceso artesanal.
        </h2>
        <div className="institution-actions">
          <Link className="news-view-all" href="/la-fabrica">
            La fábrica →
          </Link>
          <Link className="news-view-all" href="/proceso-artesanal">
            Proceso artesanal →
          </Link>
        </div>
      </section>
      <HomeMosaic />
      <section className="section guests-section home-collections">
        <div className="news-section-heading">
          <div>
            <p className="eyebrow orange">NUESTRAS ALFOMBRAS</p>
            <h2>
              Descubrí las
              <br />
              <em>colecciones.</em>
            </h2>
          </div>
          <Link className="news-view-all" href="/colecciones">
            Ver todas →
          </Link>
        </div>
        {data.collections.items.length ? (
          <CollectionCards compact items={data.collections.items.slice(0, 9)} />
        ) : (
          <p className="empty">
            {data.collections.error
              ? "No pudimos cargar las colecciones. Volvé a intentar en unos minutos."
              : "Muy pronto compartiremos nuestras colecciones."}
          </p>
        )}
      </section>
      <section className="section instagram-section">
        <p className="eyebrow pink">DESDE LA FÁBRICA</p>
        <h2>En Instagram</h2>
        {data.reels.items.length ? (
          <div className="reel-strip">
            {data.reels.items.map((r) => (
              <a
                className="reel-card"
                key={r.id}
                href={safeWebUrl(r.url)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Ver ${r.title} en Instagram (abre otra pestaña)`}
              >
                {r.image ? (
                  <img
                    src={fileUrl(r.collectionId, r.id, r.image)}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <div className="reel-placeholder">▶</div>
                )}
                <span className="reel-caption">
                  <strong>{r.title}</strong>
                  <span>Ver reel en Instagram ↗</span>
                </span>
                <span className="reel-play" aria-hidden="true">
                  ▶
                </span>
              </a>
            ))}
          </div>
        ) : (
          <p className="empty">
            {data.reels.error
              ? "Instagram no está disponible temporalmente."
              : "Muy pronto compartiremos los reels de la fábrica."}
          </p>
        )}
      </section>
      <section id="ubicacion" className="map-section">
        <div>
          <p className="eyebrow">VENÍ A CONOCERNOS</p>
          <h2>La fábrica</h2>
          {s.address ? (
            <p className="address">{s.address}</p>
          ) : (
            <p>La ubicación se publicará próximamente.</p>
          )}
          {s.hours && <p>{s.hours}</p>}
          <div className="factory-contact-actions">
            {safeWebUrl(s.map_url) && (
              <a
                className="light-button"
                href={safeWebUrl(s.map_url)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver ubicación ↗
              </a>
            )}
            {validWhatsapp(s.whatsapp) && (
              <a
                className="light-button"
                href={`https://wa.me/${s.whatsapp}?text=${encodeURIComponent("Hola, me gustaría contactarme con la Fábrica de Alfombras - Catamarca. Gracias")}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contacto por WhatsApp (abre otra pestaña)"
              >
                Contacto ↗
              </a>
            )}
          </div>
        </div>
        <div className="map-art">
          <Link href="/tienda" className="map-store">
            Explorá
            <br />
            la tienda ↗
          </Link>
        </div>
      </section>
    </>
  );
}
