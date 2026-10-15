import type { CSSProperties } from "react";
import { getSiteSettings, defaultSettings } from "@/lib/settings";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import "../institution.css";
import "../institution-extra.css";
export const dynamic = "force-dynamic";
export default async function InstitutionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getSiteSettings();
  const color = (v: string, f: string) => (/^#[0-9a-f]{6}$/i.test(v) ? v : f);
  const theme = {
    "--accent": color(s.accent_color, defaultSettings.accent_color),
    "--paper": color(s.background_color, defaultSettings.background_color),
    "--surface": color(s.surface_color, defaultSettings.surface_color),
    "--news-surface": color(s.news_color, defaultSettings.news_color),
    "--ink": color(s.text_color, defaultSettings.text_color),
  } as CSSProperties;
  return (
    <div className="institution" style={theme}>
      <SiteHeader />
      <main id="contenido">{children}</main>
      <SiteFooter />
    </div>
  );
}
