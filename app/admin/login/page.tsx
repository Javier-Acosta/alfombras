"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
export default function Login() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: f.get("email"),
          password: f.get("password"),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      router.push("/admin");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos iniciar sesión.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="contenido" className="login">
      <form onSubmit={submit}>
        <p className="eyebrow blue">FÁBRICA DE ALFOMBRAS CATAMARCA</p>
        <h1>Ingresar</h1>
        <label>
          Correo
          <input type="email" name="email" autoComplete="username" required />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button disabled={busy}>
          {busy ? "Ingresando…" : "Entrar al panel →"}
        </button>
        <Link href="/">← Volver al sitio</Link>
      </form>
    </main>
  );
}
