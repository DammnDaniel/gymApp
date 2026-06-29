"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  useSaveWorkout,
  useWorkoutDay,
  type SaveSetInput,
  type WorkoutDay,
} from "@/lib/queries/workouts";
import { ExerciseLogger, type SetRow } from "./ExerciseLogger";

export function WorkoutSession({ dayId }: { dayId: string }) {
  const { data, isLoading, error } = useWorkoutDay(dayId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-44 animate-pulse rounded bg-surface-3" />
        <div className="h-48 animate-pulse rounded-lg bg-surface-3" />
        <div className="h-48 animate-pulse rounded-lg bg-surface-3" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/routines" className="kicker-accent">
          &lt; Salir
        </Link>
        <p className="text-sm text-danger">No se pudo cargar el día.</p>
      </div>
    );
  }
  return <SessionBody day={data} />;
}

function SessionBody({ day }: { day: WorkoutDay }) {
  const router = useRouter();
  const save = useSaveWorkout();

  const [state, setState] = useState<Record<string, SetRow[]>>(() => {
    const init: Record<string, SetRow[]> = {};
    for (const ex of day.exercises) {
      const n = Math.max(ex.target_sets ?? 0, ex.lastSets.length, 1);
      init[ex.rowId] = Array.from({ length: n }, (_, i) => {
        const last = ex.lastSets[i];
        return {
          weight: last?.weight_kg != null ? String(last.weight_kg) : "",
          reps: last?.reps != null ? String(last.reps) : "",
          rpe: last?.rpe != null ? String(last.rpe) : "",
          done: false,
        };
      });
    }
    return init;
  });

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const totalDone = useMemo(
    () => Object.values(state).flat().filter((r) => r.done).length,
    [state],
  );

  async function onFinish() {
    const sets: SaveSetInput[] = [];
    for (const ex of day.exercises) {
      (state[ex.rowId] ?? []).forEach((r, i) => {
        const hasData = r.done || r.weight !== "" || r.reps !== "";
        if (!hasData) return;
        const w = parseFloat(r.weight.replace(",", "."));
        const reps = parseInt(r.reps, 10);
        const rpe = parseFloat(r.rpe.replace(",", "."));
        sets.push({
          exerciseId: ex.exerciseId,
          set_number: i + 1,
          weight_kg: Number.isFinite(w) ? w : null,
          reps: Number.isFinite(reps) ? reps : null,
          rpe: Number.isFinite(rpe) ? rpe : null,
          is_warmup: false,
        });
      });
    }
    try {
      await save.mutateAsync({
        dayId: day.id,
        durationSeconds: elapsed,
        sets,
      });
      router.replace("/dashboard");
      router.refresh();
    } catch {
      /* error visible al recargar */
    }
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <Link href="/routines" className="kicker-accent">
          &lt; Salir
        </Link>
        <span className="rounded-sm bg-surface-2 px-2.5 py-1 font-mono text-sm tabular-nums text-ink">
          {mm}:{ss}
        </span>
      </div>

      <div>
        <p className="kicker">// {day.routineName}</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tightd text-ink">
          {day.name}
        </h1>
      </div>

      {day.exercises.length === 0 ? (
        <p className="text-sm text-ink-mute">Este día no tiene ejercicios.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {day.exercises.map((ex) => (
            <ExerciseLogger
              key={ex.rowId}
              ex={ex}
              rows={state[ex.rowId] ?? []}
              onChange={(rows) =>
                setState((s) => ({ ...s, [ex.rowId]: rows }))
              }
            />
          ))}
        </div>
      )}

      <button
        onClick={onFinish}
        disabled={save.isPending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-accent px-5 font-mono text-[13px] font-semibold uppercase tracking-[0.04em] text-accent-ink shadow-glow transition active:scale-[0.99] disabled:opacity-50"
      >
        {save.isPending
          ? "Guardando"
          : `Finalizar · ${totalDone} ${totalDone === 1 ? "serie" : "series"}`}
      </button>
    </div>
  );
}
