"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { AuthFrame } from "@/components/AuthFrame";

type RecoveryStatus = "checking" | "ready" | "invalid" | "done";

const inputClass = "field";

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
      <main className="flex min-h-[100dvh] items-center justify-center bg-inverse p-6">
        <p role="status" className="border-l-4 border-accent pl-4 font-mono text-sm text-[var(--inverse-text)]">Validando el enlace…</p>
      </main>
    );
  }

  if (status === "invalid") {
    return (
      <AuthFrame eyebrow="Enlace no válido" title={<>Solicita<br />otro enlace.</>} description="El enlace ha caducado, ya se ha usado o no contiene una sesión de recuperación válida.">
        <section>
          <Link
            href="/forgot-password"
            className="button-primary w-full"
          >
            Solicitar otro
          </Link>
        </section>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame eyebrow="Último paso" title={<>Nueva<br />contraseña.</>} description="Usa al menos 8 caracteres y no reutilices la contraseña anterior.">
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-4 border-t border-ink pt-6"
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
            className="border-l-4 border-danger bg-[rgba(199,45,39,0.09)] px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || status === "done"}
          className="button-primary w-full"
        >
          {loading ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>
    </AuthFrame>
  );
}
