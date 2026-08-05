"use client";

import { useRouter } from "next/navigation";
import { useRoutines, useCreateRoutine } from "@/lib/queries/routines";
import { RoutineCard } from "@/components/routines/RoutineCard";
import { PageIntro } from "@/components/PageIntro";

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
    <div className="flex flex-col gap-8">
      <PageIntro
        eyebrow="Programación"
        title="El plan."
        count={data ? data.length : "—"}
        countLabel={data && data.length === 1 ? "rutina" : "rutinas"}
        description="Tus semanas de trabajo y la rutina compartida, en un solo índice."
        action={<button
          onClick={onCreate}
          disabled={create.isPending}
          className="button-primary min-h-10 px-4"
        >
          {create.isPending ? "Creando" : "+ Nueva"}
        </button>}
      />

      {error && (
        <p className="text-sm text-danger">No se pudieron cargar las rutinas.</p>
      )}

      {isLoading ? (
        <div className="flex flex-col border-t border-ink">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse border border-border bg-surface-3" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="flex flex-col gap-3">
          {data.map((r) => (
            <RoutineCard key={r.id} r={r} />
          ))}
        </div>
      ) : (
        <div className="panel p-8 text-center">
          <p className="text-ink-mute">Aún no tienes rutinas.</p>
          <button
            onClick={onCreate}
            disabled={create.isPending}
            className="button-primary mt-5"
          >
            Crear mi primera rutina
          </button>
        </div>
      )}
    </div>
  );
}
