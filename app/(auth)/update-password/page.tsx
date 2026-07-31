"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type RecoveryStatus = "checking" | "ready" | "invalid" | "done";

const inputClass =
  "h-12 w-full rounded-md border border-border bg-surface-2 px-4 text-[16px] text-ink placeholder:text-ink-faint focus:border-transparent focus:bg-surface-3 focus:outline-none focus:shadow-focusring";

function getJwtSubject(token: string | null) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const parsed = JSON.parse(atob(padded)) as { sub?: unknown };
    return typeof parsed.sub === "string" ? parsed.sub : null;
  } catch {
    return null;
  }
}

export default function UpdatePasswordPage() {
  const router = useRouter();
  const clientRef = useRef<SupabaseClient | null>(null);
  const [status, setStatus] = useState<RecoveryStatus>("checking");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    let recoveryReady = false;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const isRecoveryLink = hash.get("type") === "recovery";
    const recoveryUserId = getJwtSubject(hash.get("access_token"));
    const supabase = createClient();
    clientRef.current = supabase;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" && session) {
        recoveryReady = true;
        setStatus("ready");
      }
    });

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active || recoveryReady) return;
      setStatus(
        !sessionError &&
          data.session?.user.id === recoveryUserId &&
          isRecoveryLink
          ? "ready"
          : "invalid",
      );
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const supabase = clientRef.current;
    if (!supabase) {
      setError("El enlace no se ha podido validar. Solicita uno nuevo.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(
        updateError.message.toLowerCase().includes("same password")
          ? "La nueva contraseña debe ser distinta de la anterior."
          : "No se pudo cambiar la contraseña. Solicita un enlace nuevo.",
      );
      setLoading(false);
      return;
    }

    setStatus("done");
    await supabase.auth.signOut();
    router.replace("/login?passwordUpdated=1");
    router.refresh();
  }

  if (status === "checking") {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-bg-0 p-6">
        <p role="status" className="font-mono text-sm text-ink-mute">
          Validando el enlace…
        </p>
      </main>
    );
  }

  if (status === "invalid") {
    return (
      <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-sm flex-col justify-center gap-6 overflow-hidden p-6">
        <div className="pointer-events-none absolute inset-0 bg-[var(--grain)]" />
        <section className="relative rounded-xl bg-surface p-5 shadow-card">
          <p className="kicker-accent">// Enlace no válido</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tightd text-ink">
            Solicita otro enlace
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-mute">
            El enlace ha caducado, ya se ha usado o no contiene una sesión de
            recuperación válida.
          </p>
          <Link
            href="/forgot-password"
            className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-md bg-accent px-5 font-mono text-[13px] font-semibold uppercase tracking-[0.04em] text-accent-ink shadow-glow"
          >
            Solicitar otro
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-sm flex-col justify-center gap-7 overflow-hidden p-6">
      <div className="pointer-events-none absolute inset-0 bg-[var(--grain)]" />

      <div className="relative">
        <p className="kicker-accent">// Último paso</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold leading-none tracking-tightd text-ink">
          Crea una contraseña nueva
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-mute">
          Usa al menos 8 caracteres y no reutilices la contraseña anterior.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="relative flex flex-col gap-4 rounded-xl bg-surface p-5 shadow-card"
      >
        <div>
          <label
            htmlFor="new-password"
            className="mb-1.5 block font-mono text-[11px] uppercase tracking-kicker text-ink-mute"
          >
            Nueva contraseña
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="confirm-password"
            className="mb-1.5 block font-mono text-[11px] uppercase tracking-kicker text-ink-mute"
          >
            Repite la contraseña
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
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
          disabled={loading || status === "done"}
          className="inline-flex h-12 w-full items-center justify-center rounded-md bg-accent px-5 font-mono text-[13px] font-semibold uppercase tracking-[0.04em] text-accent-ink shadow-glow transition active:scale-[0.985] disabled:opacity-45 disabled:shadow-none"
        >
          {loading ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>
    </main>
  );
}
