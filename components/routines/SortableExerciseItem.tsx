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

export function SortableExerciseItem({
  routineId,
  dayId,
  re,
}: {
  routineId: string;
  dayId: string;
  re: RoutineExercise;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: re.id });
  const remove = useRemoveExercise();
  const swap = useSwapExercise();
  const [picker, setPicker] = useState(false);

  const href = re.exercise
    ? `/exercises/${encodeURIComponent(re.exercise.slug)}`
    : "#";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-md bg-surface-2 p-3 ${
        isDragging ? "z-10 opacity-60 shadow-hero" : ""
      }`}
    >
      <div className="flex items-start gap-2.5">
        <button
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
        </button>

        <Link
          href={href}
          className="h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-surface-3"
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
              className="line-clamp-2 text-sm font-semibold leading-snug text-ink"
            >
              {re.exercise?.name ?? "Ejercicio"}
            </Link>
            <div className="flex shrink-0 gap-2.5">
              <button
                onClick={() => setPicker(true)}
                className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint transition hover:text-accent"
              >
                Cambiar
              </button>
              <button
                onClick={() =>
                  remove.mutate({ routineId, dayId, rowId: re.id })
                }
                className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint transition hover:text-danger"
              >
                Quitar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2.5 pl-[34px]">
        <InlineSetsReps routineId={routineId} dayId={dayId} re={re} />
      </div>

      <ExercisePicker
        open={picker}
        title="Cambiar ejercicio"
        onClose={() => setPicker(false)}
        onPick={(exerciseId) =>
          swap.mutate({ routineId, dayId, rowId: re.id, newExerciseId: exerciseId })
        }
      />
    </div>
  );
}
