import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Fábrica de Alfombras Catamarca",
    template: "%s | Fábrica de Alfombras Catamarca",
  },
  description:
    "La fábrica, el proceso artesanal y las colecciones de alfombras de Catamarca.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <a className="skip-link" href="#contenido">
          Ir al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
