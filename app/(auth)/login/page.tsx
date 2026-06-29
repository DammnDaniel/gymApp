"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginRequest } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginRequest(username.trim(), password);
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "h-12 w-full rounded-md border border-border bg-surface-2 px-4 text-[16px] text-ink placeholder:text-ink-faint focus:border-transparent focus:bg-surface-3 focus:outline-none focus:shadow-focusring";

  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-sm flex-col justify-center gap-8 overflow-hidden p-6">
      <div className="pointer-events-none absolute inset-0 bg-[var(--grain)]" />

      <div className="relative">
        <h1 className="font-display text-[44px] font-extrabold leading-none tracking-tightd">
          <span className="text-ink">GYM</span>
          <span className="text-accent">APP</span>
        </h1>
        <p className="mt-3 text-ink-mute">Entra para empezar a entrenar.</p>
      </div>

      <form
        onSubmit={onSubmit}
        className="relative flex flex-col gap-3 rounded-xl bg-surface p-5 shadow-card"
      >
        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-kicker text-ink-mute">
            Usuario
          </label>
          <input
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-kicker text-ink-mute">
            Contraseña
          </label>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
        </div>

        {error && (
          <p className="rounded-md bg-[rgba(255,93,93,0.1)] px-4 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-accent px-5 font-mono text-[13px] font-semibold uppercase tracking-[0.04em] text-accent-ink shadow-glow transition active:scale-[0.985] active:bg-accent-press disabled:opacity-45 disabled:shadow-none"
        >
          {loading ? "Entrando" : "Entrar"} <span aria-hidden>→</span>
        </button>
      </form>
    </main>
  );
}
