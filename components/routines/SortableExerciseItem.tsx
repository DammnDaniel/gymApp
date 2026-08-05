"use client";

import Link from "next/link";
import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useRemoveExercise,
  useSwapExercise,
  type RoutineExercise,
} from "@/lib/queries/routines";
import { InlineSetsReps } from "./InlineSetsReps";
import { ExercisePicker } from "./ExercisePicker";
import { exerciseDetailHref } from "@/lib/navigation";

export function SortableExerciseItem({
  routineId,
  dayId,
  re,
  readOnly = false,
}: {
  routineId: string;
  dayId: string;
  re: RoutineExercise;
  readOnly?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: re.id, disabled: readOnly });
  const remove = useRemoveExercise();
  const swap = useSwapExercise();
  const [picker, setPicker] = useState(false);

  const href = re.exercise
    ? exerciseDetailHref(re.exercise.slug, `/routines/${routineId}`)
    : "#";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`border-b border-ink/15 bg-transparent py-3 ${
        isDragging ? "z-10 opacity-60 shadow-hero" : ""
      }`}
    >
      <div className="flex items-start gap-2.5">
        {!readOnly && <button
          {...attributes}
          {...listeners}
          aria-label="Reordenar ejercicio"
          className="mt-0.5 flex h-9 w-6 shrink-0 cursor-grab touch-none items-center justify-center text-ink-faint transition hover:text-ink active:cursor-grabbing"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden>
            <circle cx="5" cy="3" r="1.4" />
            <circle cx="11" cy="3" r="1.4" />
            <circle cx="5" cy="8" r="1.4" />
            <circle cx="11" cy="8" r="1.4" />
            <circle cx="5" cy="13" r="1.4" />
            <circle cx="11" cy="13" r="1.4" />
          </svg>
        </button>}

        <Link
          href={href}
          className="h-14 w-14 shrink-0 overflow-hidden border border-ink/20 bg-surface-3"
        >
          {re.exercise?.image_start && (
            <img
              src={re.exercise.image_start}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={href}
              className="line-clamp-2 font-display text-[15px] font-extrabold leading-[1.08] tracking-[-0.03em] text-ink"
            >
              {re.exercise?.name_es ?? re.exercise?.name ?? "Ejercicio"}
            </Link>
            {!readOnly && <div className="flex shrink-0 gap-2.5">
              <button
                onClick={() => setPicker(true)}
                className="min-h-8 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-mute transition hover:text-signal"
              >
                Cambiar
              </button>
              <button
                onClick={() =>
                  remove.mutate({ routineId, dayId, rowId: re.id })
                }
                className="min-h-8 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-mute transition hover:text-danger"
              >
                Quitar
              </button>
            </div>}
          </div>
        </div>
      </div>

      <div className={`mt-2.5 ${readOnly ? "pl-[66px]" : "pl-[34px]"}`}>
        {readOnly ? (
          <div className="flex flex-col gap-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-mute">{formatTarget(re)}</p>
            {re.notes && <p className="text-[13px] text-ink-mute">{re.notes}</p>}
          </div>
        ) : <InlineSetsReps routineId={routineId} dayId={dayId} re={re} />}
      </div>

      {!readOnly && <ExercisePicker
        open={picker}
        title="Cambiar ejercicio"
        onClose={() => setPicker(false)}
        onPick={(exerciseId) =>
          swap.mutateAsync({ routineId, dayId, rowId: re.id, newExerciseId: exerciseId })
        }
      />}
    </div>
  );
}

function formatTarget(re: RoutineExercise) {
  const sets = re.target_sets ? `${re.target_sets} series` : "Series indicadas";
  if (re.target_reps_min && re.target_reps_max) {
    const reps = re.target_reps_min === re.target_reps_max
      ? `${re.target_reps_min} reps`
      : `${re.target_reps_min}–${re.target_reps_max} reps`;
    return `${sets} · ${reps}`;
  }
  return sets;
}
