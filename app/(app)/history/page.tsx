"use client";

import Link from "next/link";
import { useDeleteSession, useSessions } from "@/lib/queries/workouts";

function fmt(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) +
    " · " +
    d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  );
}

export default function HistoryPage() {
  const { data, isLoading, error } = useSessions();
  const del = useDeleteSession();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="kicker">// Historial</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-display text-stat font-extrabold tabular-nums text-ink">
            {data ? data.length : "—"}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-kicker text-ink-mute">
            {data && data.length === 1 ? "sesión" : "sesiones"}
          </span>
        </div>
      </div>

      {error && (
        <p className="text-sm text-danger">No se pudo cargar el historial.</p>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-surface-3" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="flex flex-col gap-3">
          {data.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-surface p-4 shadow-card"
            >
              <Link href={`/history/${s.id}`} className="min-w-0 flex-1">
                <div className="truncate font-display text-base font-bold tracking-tightd text-ink">
                  {s.dayName ?? "Sesión"}
                </div>
                {s.routineName && (
                  <div className="mt-0.5 truncate text-sm text-ink-mute">
                    {s.routineName}
                  </div>
                )}
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                  {fmt(s.performed_at)} · {s.setCount}{" "}
                  {s.setCount === 1 ? "serie" : "series"}
                  {s.duration_seconds
                    ? ` · ${Math.round(s.duration_seconds / 60)} min`
                    : ""}
                </div>
              </Link>
              <button
                onClick={() => {
                  if (window.confirm("¿Borrar esta sesión?")) del.mutate(s.id);
                }}
                className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint transition hover:text-danger"
              >
                Borrar
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-surface p-6 text-center shadow-card">
          <p className="text-ink-mute">Aún no has registrado ninguna sesión.</p>
          <Link
            href="/routines"
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-md bg-accent px-5 font-mono text-[13px] font-semibold uppercase tracking-[0.04em] text-accent-ink shadow-glow"
          >
            Ir a entrenar
          </Link>
        </div>
      )}
    </div>
  );
}
