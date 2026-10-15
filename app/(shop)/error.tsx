"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="contenido" style={{ padding: "80px 7vw" }}>
      <h1>No pudimos cargar esta página</h1>
      <p>
        El pedido o catálogo no está disponible temporalmente. Conservá la
        dirección y volvé a intentar.
      </p>
      <button onClick={reset}>Reintentar</button>
    </main>
  );
}
