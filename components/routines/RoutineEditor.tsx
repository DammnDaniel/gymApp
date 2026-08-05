"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

  useEffect(() => setName(routine.name), [routine.name]);
  useEffect(() => setDesc(routine.description ?? ""), [routine.description]);

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
    <div className="flex flex-col gap-8">
      <div className="flex min-h-11 items-center justify-between border-b border-ink/20 pb-3">
        <Link href="/routines" className="kicker-accent">
          ← Volver al plan
        </Link>
        {!routine.is_shared && (
          <button
            onClick={async () => {
              if (!window.confirm("¿Borrar esta rutina entera?")) return;
              try {
                await deleteRoutine.mutateAsync(routine.id);
                router.replace("/routines");
              } catch {
                window.alert("No se pudo borrar la rutina.");
              }
            }}
            className="min-h-10 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-mute transition hover:text-danger"
          >
            Borrar rutina
          </button>
        )}
      </div>

      <div className="border-b border-ink pb-6">
        {routine.is_shared ? (
          <>
            <p className="mb-4 inline-flex border-l-4 border-signal bg-signal-soft px-3 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-signal">
              Rutina compartida · solo lectura
            </p>
            <h1 className="page-title">
              {routine.name}
            </h1>
            {routine.description && (
              <p className="mt-1 text-sm text-ink-mute">{routine.description}</p>
            )}
          </>
        ) : (
          <>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                const v = name.trim();
                if (v && v !== routine.name)
                  rename.mutate({ id: routine.id, name: v });
              }}
              className="page-title w-full bg-transparent outline-none focus:shadow-none"
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
              className="mt-4 w-full max-w-xl border-l-2 border-accent bg-transparent pl-3 text-sm text-ink-mute outline-none placeholder:text-ink-faint"
            />
          </>
        )}
      </div>

      <div className="flex flex-col gap-8">
        {routine.routine_days.map((day, i) => (
          <div key={day.id}>
            <div className="mb-2 flex items-center justify-between">
              <span className="rule-label">
                Día {String(i + 1).padStart(2, "0")}
              </span>
              {!routine.is_shared && <div className="flex gap-1.5">
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
              </div>}
            </div>
            <DaySection routineId={routine.id} day={day} readOnly={routine.is_shared} />
          </div>
        ))}
      </div>

      {!routine.is_shared && <button
        onClick={() =>
          createDay.mutate({
            routineId: routine.id,
            name: `Día ${routine.routine_days.length + 1}`,
            position: routine.routine_days.length,
          })
        }
        className="button-secondary w-full border-dashed"
      >
        + Añadir día
      </button>}
    </div>
  );
}
