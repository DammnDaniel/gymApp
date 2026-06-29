"use client";

import { useEffect, useState } from "react";
import { useExercises } from "@/lib/queries/exercises";
import { ExerciseCard } from "@/components/ExerciseCard";
import { ExerciseFilters } from "@/components/ExerciseFilters";

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
    <div className="flex flex-col gap-5">
      <div>
        <p className="kicker">// Biblioteca</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-display text-stat font-extrabold tabular-nums text-ink">
            {data ? data.length : "—"}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-kicker text-ink-mute">
            ejercicios
          </span>
        </div>
      </div>

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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-lg bg-surface-3"
            />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
