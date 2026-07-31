"use client";

import Link from "next/link";
import { useState } from "react";
import { passwordResetRequest } from "@/lib/auth";

const inputClass =
  "h-12 w-full rounded-md border border-border bg-surface-2 px-4 text-[16px] text-ink placeholder:text-ink-faint focus:border-transparent focus:bg-surface-3 focus:outline-none focus:shadow-focusring";

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
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-sm flex-col justify-center gap-7 overflow-hidden p-6">
      <div className="pointer-events-none absolute inset-0 bg-[var(--grain)]" />

      <div className="relative">
        <p className="kicker-accent">// Recuperar acceso</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold leading-none tracking-tightd text-ink">
          Cambia tu contraseña
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-mute">
          Introduce tu usuario. Te enviaremos un enlace al correo asociado a tu
          cuenta; nunca mostraremos esa dirección aquí.
        </p>
      </div>

      {sent ? (
        <section className="relative rounded-xl border border-accent/20 bg-surface p-5 shadow-card">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-xl text-accent">
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
            className="mt-5 h-11 w-full rounded-md border border-border-strong bg-surface-2 px-4 text-sm font-semibold text-ink transition active:scale-[0.985]"
          >
            Volver a intentarlo
          </button>
        </section>
      ) : (
        <form
          onSubmit={onSubmit}
          className="relative flex flex-col gap-4 rounded-xl bg-surface p-5 shadow-card"
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
              className="rounded-md bg-[rgba(255,93,93,0.1)] px-4 py-2.5 text-sm text-danger"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="inline-flex h-12 w-full items-center justify-center rounded-md bg-accent px-5 font-mono text-[13px] font-semibold uppercase tracking-[0.04em] text-accent-ink shadow-glow transition active:scale-[0.985] disabled:opacity-45 disabled:shadow-none"
          >
            {loading ? "Enviando…" : "Enviar enlace"}
          </button>
        </form>
      )}

      <Link
        href="/login"
        className="relative text-center text-sm font-medium text-ink-mute transition hover:text-ink"
      >
        ← Volver al inicio de sesión
      </Link>
    </main>
  );
}
