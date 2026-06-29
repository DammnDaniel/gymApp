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
  onPick: (exerciseId: string) => void;
}) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [muscle, setMuscle] = useState("");
  const [equipment, setEquipment] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  const { data, isLoading } = useExercises({ q: debouncedQ, muscle, equipment });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[100dvh] w-full max-w-2xl flex-col">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <p className="kicker-accent">// {title}</p>
          <button
            onClick={onClose}
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-mute transition hover:text-ink"
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse rounded-lg bg-surface-3"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {data?.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => {
                    onPick(ex.id);
                    onClose();
                  }}
                  className="group flex flex-col overflow-hidden rounded-lg bg-surface text-left shadow-card transition hover:bg-surface-2"
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
                    <div className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink">
                      {ex.name}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-mute">
                      {esMuscle(ex.primary_muscles?.[0])}
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
