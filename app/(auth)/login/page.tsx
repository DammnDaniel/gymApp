"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginRequest } from "@/lib/auth";
import { AuthFrame } from "@/components/AuthFrame";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  return (
    <AuthFrame
      eyebrow="Acceso privado"
      title={<>Vuelve al<br />trabajo.</>}
      description="Entra con tu usuario. Tus rutinas, borradores y sesiones siguen exactamente donde los dejaste."
    >
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-5 border-t border-ink pt-6"
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
            className="field"
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label className="font-mono text-[11px] uppercase tracking-kicker text-ink-mute">
              Contraseña
            </label>
            <Link
              href="/forgot-password"
              className="min-h-8 text-xs font-semibold text-signal transition hover:underline"
            >
              La he olvidado
            </Link>
          </div>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
        </div>

        {searchParams.get("passwordUpdated") === "1" && (
          <p
            role="status"
            className="border-l-4 border-signal bg-signal-soft px-4 py-3 text-sm text-ink"
          >
            Contraseña actualizada. Ya puedes iniciar sesión.
          </p>
        )}

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
          disabled={loading}
          className="button-primary mt-1 w-full"
        >
          {loading ? "Entrando" : "Entrar"} <span aria-hidden>→</span>
        </button>
      </form>
    </AuthFrame>
  );
}
