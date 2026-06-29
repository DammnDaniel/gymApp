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
        <h1 className="text-2xl font-semibold tracking-tight">Biblioteca</h1>
        <p className="text-sm text-zinc-500">
          {data ? `${data.length} ejercicios` : "Catálogo de ejercicios"}
        </p>
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
        <p className="text-sm text-red-600 dark:text-red-400">
          No se pudieron cargar los ejercicios.
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900"
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
        <p className="py-10 text-center text-sm text-zinc-500">
          Sin resultados. Prueba otra búsqueda.
        </p>
      )}
    </div>
  );
}
