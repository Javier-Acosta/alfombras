"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="section">
      <h1>No pudimos cargar esta página</h1>
      <p>Volvé a intentarlo en unos minutos.</p>
      <button onClick={reset}>Reintentar</button>
    </section>
  );
}
