"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  useSaveWorkout,
  useWorkoutDay,
  type SaveSetInput,
  type WorkoutDay,
  type WorkoutExercise,
} from "@/lib/queries/workouts";
import { ExerciseLogger, type SetRow } from "./ExerciseLogger";

type Draft = { state: Record<string, SetRow[]>; startedAt: number };

const draftKey = (dayId: string) => `gymapp:workout:${dayId}`;

function autofillRows(ex: WorkoutExercise): SetRow[] {
  if (ex.category === "cardio") {
    const last = ex.lastSets[0];
    const mins =
      last?.duration_seconds != null
        ? String(Math.round(last.duration_seconds / 60))
        : "";
    return [{ weight: "", reps: "", rpe: "", minutes: mins, done: false }];
  }
  const n = Math.max(ex.target_sets ?? 0, ex.lastSets.length, 1);
  return Array.from({ length: n }, (_, i) => {
    const last = ex.lastSets[i];
    return {
      weight: last?.weight_kg != null ? String(last.weight_kg) : "",
      reps: last?.reps != null ? String(last.reps) : "",
      rpe: last?.rpe != null ? String(last.rpe) : "",
      minutes: "",
      done: false,
    };
  });
}

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

  // Estado inicial: borrador guardado (si existe) fusionado con el día actual;
  // si no, autorrelleno de la última sesión.
  const [{ state, startedAt }, setSession] = useState<Draft>(() => {
    let draft: Draft | null = null;
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(draftKey(day.id));
        if (raw) draft = JSON.parse(raw);
      } catch {
        /* ignorar borrador corrupto */
      }
    }
    const init: Record<string, SetRow[]> = {};
    for (const ex of day.exercises) {
      init[ex.rowId] = draft?.state?.[ex.rowId] ?? autofillRows(ex);
    }
    return { state: init, startedAt: draft?.startedAt ?? Date.now() };
  });

  // Persistir el borrador en cada cambio (sobrevive a salir/cerrar y volver).
  useEffect(() => {
    try {
      window.localStorage.setItem(
        draftKey(day.id),
        JSON.stringify({ state, startedAt }),
      );
    } catch {
      /* almacenamiento lleno / no disponible */
    }
  }, [state, startedAt, day.id]);

  // Cronómetro derivado de startedAt.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));

  const totalDone = useMemo(
    () => Object.values(state).flat().filter((r) => r.done).length,
    [state],
  );

  function updateRows(rowId: string, rows: SetRow[]) {
    setSession((prev) => ({ ...prev, state: { ...prev.state, [rowId]: rows } }));
  }

  function clearDraft() {
    try {
      window.localStorage.removeItem(draftKey(day.id));
    } catch {
      /* noop */
    }
  }

  async function onFinish() {
    if (!window.confirm("¿Terminar y guardar la sesión en tu perfil?")) return;
    const sets: SaveSetInput[] = [];
    for (const ex of day.exercises) {
      const rows = state[ex.rowId] ?? [];
      if (ex.category === "cardio") {
        const r = rows[0];
        if (r && (r.done || r.minutes !== "")) {
          const mins = parseInt(r.minutes, 10);
          sets.push({
            exerciseId: ex.exerciseId,
            set_number: 1,
            weight_kg: null,
            reps: null,
            rpe: null,
            duration_seconds: Number.isFinite(mins) ? mins * 60 : null,
            is_warmup: false,
          });
        }
        continue;
      }
      rows.forEach((r, i) => {
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
          duration_seconds: null,
          is_warmup: false,
        });
      });
    }
    if (sets.length === 0) {
      window.alert("No has registrado ninguna serie todavía.");
      return;
    }
    try {
      await save.mutateAsync({ dayId: day.id, durationSeconds: elapsed, sets });
      clearDraft();
      router.replace("/history");
      router.refresh();
    } catch {
      window.alert("No se pudo guardar. Inténtalo de nuevo.");
    }
  }

  function onDiscard() {
    if (!window.confirm("¿Descartar este entreno? Se perderá lo registrado."))
      return;
    clearDraft();
    router.replace("/routines");
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
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
          Tu progreso se guarda solo · sal y vuelve cuando quieras
        </p>
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
              onChange={(rows) => updateRows(ex.rowId, rows)}
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
          : `Finalizar entreno · ${totalDone} ${totalDone === 1 ? "serie" : "series"}`}
      </button>
      <button
        onClick={onDiscard}
        className="mx-auto -mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint transition hover:text-danger"
      >
        Descartar entreno
      </button>
    </div>
  );
}
