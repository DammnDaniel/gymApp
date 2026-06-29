"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useAddExercise,
  useDeleteDay,
  useReorderExercises,
  useUpdateDay,
  type RoutineDay,
} from "@/lib/queries/routines";
import { SortableExerciseItem } from "./SortableExerciseItem";
import { ExercisePicker } from "./ExercisePicker";

export function DaySection({
  routineId,
  day,
}: {
  routineId: string;
  day: RoutineDay;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const reorder = useReorderExercises();
  const updateDay = useUpdateDay();
  const deleteDay = useDeleteDay();
  const addExercise = useAddExercise();

  const [name, setName] = useState(day.name);
  const [focus, setFocus] = useState(day.focus ?? "");
  const [picker, setPicker] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const items = day.routine_exercises.map((re) => re.id);
  const activeRe = day.routine_exercises.find((re) => re.id === activeId);

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.indexOf(String(active.id));
    const newIndex = items.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    reorder.mutate({
      routineId,
      dayId: day.id,
      orderedRowIds: arrayMove(items, oldIndex, newIndex),
    });
  }

  return (
    <section className="rounded-lg bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              const v = name.trim();
              if (v && v !== day.name)
                updateDay.mutate({ routineId, dayId: day.id, name: v });
            }}
            className="w-full bg-transparent font-display text-lg font-extrabold tracking-tightd text-ink outline-none"
          />
          <input
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            onBlur={() => {
              const v = focus.trim();
              if (v !== (day.focus ?? ""))
                updateDay.mutate({
                  routineId,
                  dayId: day.id,
                  focus: v || null,
                });
            }}
            placeholder="Enfoque (opcional)"
            className="mt-0.5 w-full bg-transparent font-mono text-[11px] uppercase tracking-[0.1em] text-ink-mute outline-none placeholder:text-ink-faint"
          />
        </div>
        <button
          onClick={() => {
            if (window.confirm("¿Borrar este día?"))
              deleteDay.mutate({ routineId, dayId: day.id });
          }}
          className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint transition hover:text-danger"
        >
          Borrar
        </button>
      </div>

      {day.routine_exercises.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-faint">
          Sin ejercicios todavía.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {day.routine_exercises.map((re) => (
                <SortableExerciseItem
                  key={re.id}
                  routineId={routineId}
                  dayId={day.id}
                  re={re}
                />
              ))}
            </div>
          </SortableContext>
          {mounted &&
            createPortal(
              <DragOverlay>
                {activeRe ? (
                  <div className="rounded-md bg-surface-2 p-3 text-sm font-semibold text-ink shadow-hero">
                    {activeRe.exercise?.name ?? "Ejercicio"}
                  </div>
                ) : null}
              </DragOverlay>,
              document.body,
            )}
        </DndContext>
      )}

      <button
        onClick={() => setPicker(true)}
        className="mt-3 w-full rounded-md border border-dashed border-border-strong py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-mute transition hover:border-accent/40 hover:text-accent"
      >
        + Añadir ejercicio
      </button>

      <ExercisePicker
        open={picker}
        title="Añadir ejercicio"
        onClose={() => setPicker(false)}
        onPick={(exerciseId) =>
          addExercise.mutate({
            routineId,
            dayId: day.id,
            exerciseId,
            position: day.routine_exercises.length,
          })
        }
      />
    </section>
  );
}
