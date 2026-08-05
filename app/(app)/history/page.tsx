"use client";

import Link from "next/link";
import { useDeleteSession, useSessions } from "@/lib/queries/workouts";
import { PageIntro } from "@/components/PageIntro";

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
    <div className="flex flex-col gap-8">
      <PageIntro
        eyebrow="Archivo personal"
        title="El diario."
        count={data ? data.length : "—"}
        countLabel={data && data.length === 1 ? "sesión" : "sesiones"}
        description="Cada entrenamiento queda aquí: consulta, corrige o elimina sus series."
      />

      {error && (
        <p className="text-sm text-danger">No se pudo cargar el historial.</p>
      )}

      {isLoading ? (
        <div className="flex flex-col">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse border-b border-border bg-surface-3" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="flex flex-col border-t border-ink">
          {data.map((s, index) => (
            <div
              key={s.id}
              className="grid grid-cols-[42px_1fr_auto] items-center gap-3 border-b border-ink/25 py-5"
            >
              <span className="font-mono text-[10px] font-bold text-accent-press">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Link href={`/history/${s.id}`} className="min-w-0 flex-1">
                <div className="truncate font-display text-xl font-extrabold tracking-[-0.04em] text-ink">
                  {s.dayName ?? "Sesión"}
                </div>
                {s.routineName && (
                  <div className="mt-0.5 truncate text-sm text-ink-mute">
                    {s.routineName}
                  </div>
                )}
                <div className="mt-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-mute">
                  {fmt(s.performed_at)} · {s.setCount}{" "}
                  {s.setCount === 1 ? "serie" : "series"}
                  {s.duration_seconds
                    ? ` · ${Math.round(s.duration_seconds / 60)} min`
                    : ""}
                </div>
              </Link>
              <button
                onClick={async () => {
                  if (!window.confirm("¿Borrar esta sesión?")) return;
                  try {
                    await del.mutateAsync(s.id);
                  } catch {
                    window.alert("No se pudo borrar la sesión.");
                  }
                }}
                className="min-h-11 shrink-0 border-l border-ink/20 pl-3 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-mute transition hover:text-danger"
              >
                Borrar
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel p-8 text-center">
          <p className="text-ink-mute">Aún no has registrado ninguna sesión.</p>
          <Link
            href="/routines"
            className="button-primary mt-5"
          >
            Ir a entrenar
          </Link>
        </div>
      )}
    </div>
  );
}
