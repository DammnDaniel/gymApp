"use client";

import { useRouter } from "next/navigation";
import { useRoutines, useCreateRoutine } from "@/lib/queries/routines";
import { RoutineCard } from "@/components/routines/RoutineCard";

export default function RoutinesPage() {
  const router = useRouter();
  const { data, isLoading, error } = useRoutines();
  const create = useCreateRoutine();

  async function onCreate() {
    try {
      const r = await create.mutateAsync({ name: "Nueva rutina" });
      router.push(`/routines/${r.id}`);
    } catch {
      /* el error se refleja al recargar */
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="kicker">// Rutinas</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-stat font-extrabold tabular-nums text-ink">
              {data ? data.length : "—"}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-kicker text-ink-mute">
              {data && data.length === 1 ? "rutina" : "rutinas"}
            </span>
          </div>
        </div>
        <button
          onClick={onCreate}
          disabled={create.isPending}
          className="inline-flex h-10 items-center gap-1.5 rounded-md bg-accent px-4 font-mono text-[12px] font-semibold uppercase tracking-[0.04em] text-accent-ink shadow-glow transition active:scale-[0.97] disabled:opacity-50"
        >
          {create.isPending ? "Creando" : "+ Nueva"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-danger">No se pudieron cargar las rutinas.</p>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-surface-3" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="flex flex-col gap-3">
          {data.map((r) => (
            <RoutineCard key={r.id} r={r} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-surface p-6 text-center shadow-card">
          <p className="text-ink-mute">Aún no tienes rutinas.</p>
          <button
            onClick={onCreate}
            disabled={create.isPending}
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-md bg-accent px-5 font-mono text-[13px] font-semibold uppercase tracking-[0.04em] text-accent-ink shadow-glow"
          >
            Crear mi primera rutina
          </button>
        </div>
      )}
    </div>
  );
}
