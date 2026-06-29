"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  useCreateDay,
  useDeleteRoutine,
  useRenameRoutine,
  useReorderDays,
  useRoutine,
  type RoutineDetail,
} from "@/lib/queries/routines";
import { DaySection } from "./DaySection";

export function RoutineEditor({ id }: { id: string }) {
  const { data, isLoading, error } = useRoutine(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-40 animate-pulse rounded bg-surface-3" />
        <div className="h-40 animate-pulse rounded-lg bg-surface-3" />
        <div className="h-40 animate-pulse rounded-lg bg-surface-3" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/routines" className="kicker-accent">
          &lt; Rutinas
        </Link>
        <p className="text-sm text-danger">No se pudo cargar la rutina.</p>
      </div>
    );
  }

  return <EditorBody routine={data} />;
}

function EditorBody({ routine }: { routine: RoutineDetail }) {
  const router = useRouter();
  const rename = useRenameRoutine();
  const createDay = useCreateDay();
  const deleteRoutine = useDeleteRoutine();
  const reorderDays = useReorderDays();

  const [name, setName] = useState(routine.name);
  const [desc, setDesc] = useState(routine.description ?? "");

  function moveDay(index: number, dir: -1 | 1) {
    const ids = routine.routine_days.map((d) => d.id);
    const target = index + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderDays.mutate({ routineId: routine.id, orderedDayIds: ids });
  }

  const arrowCls =
    "flex h-7 w-7 items-center justify-center rounded-sm border border-border bg-surface-2 font-mono text-sm text-ink-mute transition hover:text-ink disabled:opacity-30";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link href="/routines" className="kicker-accent">
          &lt; Rutinas
        </Link>
        <button
          onClick={() => {
            if (window.confirm("¿Borrar esta rutina entera?")) {
              deleteRoutine.mutate(routine.id);
              router.replace("/routines");
            }
          }}
          className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint transition hover:text-danger"
        >
          Borrar rutina
        </button>
      </div>

      <div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            const v = name.trim();
            if (v && v !== routine.name)
              rename.mutate({ id: routine.id, name: v });
          }}
          className="w-full bg-transparent font-display text-2xl font-extrabold leading-tight tracking-tightd text-ink outline-none"
        />
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onBlur={() => {
            if (desc !== (routine.description ?? ""))
              rename.mutate({
                id: routine.id,
                name: name.trim() || routine.name,
                description: desc.trim() || null,
              });
          }}
          placeholder="Descripción…"
          className="mt-1 w-full bg-transparent text-sm text-ink-mute outline-none placeholder:text-ink-faint"
        />
      </div>

      <div className="flex flex-col gap-5">
        {routine.routine_days.map((day, i) => (
          <div key={day.id}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="kicker">
                // Día {i + 1}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => moveDay(i, -1)}
                  disabled={i === 0}
                  aria-label="Subir día"
                  className={arrowCls}
                >
                  ↑
                </button>
                <button
                  onClick={() => moveDay(i, 1)}
                  disabled={i === routine.routine_days.length - 1}
                  aria-label="Bajar día"
                  className={arrowCls}
                >
                  ↓
                </button>
              </div>
            </div>
            <DaySection routineId={routine.id} day={day} />
          </div>
        ))}
      </div>

      <button
        onClick={() =>
          createDay.mutate({
            routineId: routine.id,
            name: `Día ${routine.routine_days.length + 1}`,
            position: routine.routine_days.length,
          })
        }
        className="w-full rounded-md border border-dashed border-border-strong py-3 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-mute transition hover:border-accent/40 hover:text-accent"
      >
        + Añadir día
      </button>
    </div>
  );
}
