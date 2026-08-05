"use client";

import Link from "next/link";
import { useState } from "react";
import { passwordResetRequest } from "@/lib/auth";
import { AuthFrame } from "@/components/AuthFrame";

const inputClass = "field";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await passwordResetRequest(username.trim());
      setSent(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo enviar el enlace",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame eyebrow="Recuperar acceso" title={<>Cambia tu<br />contraseña.</>} description="Introduce tu usuario. Te enviaremos un enlace al correo asociado; nunca mostraremos esa dirección aquí.">
      {sent ? (
        <section className="border border-ink bg-surface p-5 shadow-card">
          <div className="flex h-11 w-11 items-center justify-center bg-inverse text-xl text-accent">
            ✓
          </div>
          <h2 className="mt-4 font-display text-xl font-bold text-ink">
            Revisa tu correo
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-mute">
            Si el usuario existe, recibirás un enlace para crear una contraseña
            nueva. Revisa también la carpeta de spam.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="button-secondary mt-5 w-full"
          >
            Volver a intentarlo
          </button>
        </section>
      ) : (
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 border-t border-ink pt-6"
        >
          <div>
            <label
              htmlFor="recovery-username"
              className="mb-1.5 block font-mono text-[11px] uppercase tracking-kicker text-ink-mute"
            >
              Usuario
            </label>
            <input
              id="recovery-username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              minLength={3}
              maxLength={20}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className={inputClass}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="border-l-4 border-danger bg-[rgba(199,45,39,0.09)] px-4 py-3 text-sm text-danger"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="button-primary w-full"
          >
            {loading ? "Enviando…" : "Enviar enlace"}
          </button>
        </form>
      )}

      <Link
        href="/login"
        className="mt-6 block min-h-11 text-center text-sm font-semibold text-ink-mute transition hover:text-ink"
      >
        ← Volver al inicio de sesión
      </Link>
    </AuthFrame>
  );
}
