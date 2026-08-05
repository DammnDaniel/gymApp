"use client";

import { useEffect, useState } from "react";
import { useExercises } from "@/lib/queries/exercises";
import { ExerciseCard } from "@/components/ExerciseCard";
import { ExerciseFilters } from "@/components/ExerciseFilters";
import { PageIntro } from "@/components/PageIntro";

export default function ExercisesPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [muscle, setMuscle] = useState("");
  const [equipment, setEquipment] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  const { data, isLoading, error } = useExercises({
    q: debouncedQ,
    muscle,
    equipment,
  });

  return (
    <div className="flex flex-col gap-8">
      <PageIntro
        eyebrow="Biblioteca de movimiento"
        title="La técnica."
        count={data ? data.length : "—"}
        countLabel="ejercicios"
        description="Busca por músculo o máquina y abre la ejecución antes de empezar."
      />

      <ExerciseFilters
        q={q}
        muscle={muscle}
        equipment={equipment}
        onQ={setQ}
        onMuscle={setMuscle}
        onEquipment={setEquipment}
      />

      {error && (
        <p className="text-sm text-danger">
          No se pudieron cargar los ejercicios.
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-px border border-ink/20 bg-ink/20 sm:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse bg-surface-3"
            />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-2 gap-px border border-ink/20 bg-ink/20 sm:grid-cols-3">
          {data.map((ex) => (
            <ExerciseCard key={ex.id} ex={ex} />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center font-mono text-[11px] uppercase tracking-kicker text-ink-faint">
          Sin resultados
        </p>
      )}
    </div>
  );
}
