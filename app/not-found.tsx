import Link from "next/link";
export default function NotFound() {
  return (
    <main id="contenido" style={{ padding: "80px 7vw" }}>
      <h1>Página no encontrada</h1>
      <p>Este contenido no existe o todavía no fue publicado.</p>
      <Link href="/">Volver al inicio</Link>
    </main>
  );
}
