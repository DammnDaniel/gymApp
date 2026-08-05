"use client";

import { useEffect, useState } from "react";
import { useExercises } from "@/lib/queries/exercises";
import { ExerciseFilters } from "@/components/ExerciseFilters";
import { esMuscle } from "@/lib/i18n";

export function ExercisePicker({
  open,
  title,
  onClose,
  onPick,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onPick: (exerciseId: string) => void | Promise<unknown>;
}) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [muscle, setMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [pickingId, setPickingId] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  const { data, isLoading } = useExercises({ q: debouncedQ, muscle, equipment });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-inverse/70 p-0 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="mx-auto flex h-[100dvh] w-full max-w-3xl flex-col border-ink bg-bg sm:h-[calc(100dvh-2rem)] sm:border">
        <div className="flex items-center justify-between border-b border-ink bg-bg-0 px-5 py-3.5">
          <p className="kicker-accent">{title}</p>
          <button
            onClick={onClose}
            className="min-h-11 border-l border-ink/20 pl-4 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-mute transition hover:text-ink"
          >
            Cerrar
          </button>
        </div>

        <div className="px-5 py-4">
          <ExerciseFilters
            q={q}
            muscle={muscle}
            equipment={equipment}
            onQ={setQ}
            onMuscle={setMuscle}
            onEquipment={setEquipment}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-10">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-px border border-ink/20 bg-ink/20 sm:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse bg-surface-3"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-px border border-ink/20 bg-ink/20 sm:grid-cols-3">
              {data?.map((ex) => (
                <button
                  key={ex.id}
                  disabled={pickingId !== null}
                  onClick={async () => {
                    setPickingId(ex.id);
                    try {
                      await onPick(ex.id);
                      onClose();
                    } catch {
                      window.alert("No se pudo guardar el ejercicio.");
                    } finally {
                      setPickingId(null);
                    }
                  }}
                  className="group flex min-h-[220px] flex-col overflow-hidden bg-surface text-left transition hover:bg-bg-0 disabled:opacity-50"
                >
                  <div className="aspect-square overflow-hidden bg-surface-3">
                    {ex.image_start && (
                      <img
                        src={ex.image_start}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-1 p-3">
                    <div className="line-clamp-2 font-display text-[15px] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink">
                      {ex.name_es ?? ex.name}
                    </div>
                    <div className="mt-auto pt-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-mute">
                      {pickingId === ex.id
                        ? "Guardando…"
                        : esMuscle(ex.primary_muscles?.[0])}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
