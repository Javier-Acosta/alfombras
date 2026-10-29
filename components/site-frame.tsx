import type { CSSProperties, ReactNode } from "react";
import { getSiteSettings, defaultSettings } from "@/lib/settings";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import "@/app/institution.css";
import "@/app/institution-extra.css";

export async function SiteFrame({ children }: { children: ReactNode }) {
  const s = await getSiteSettings();
  const color = (value: string, fallback: string) =>
    /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
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
      {children}
      <SiteFooter />
    </div>
  );
}
