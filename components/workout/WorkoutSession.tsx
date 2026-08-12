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

const MAX_SESSION_SECONDS = 24 * 60 * 60;

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
    const now = Date.now();
    const savedStartedAt = Number(draft?.startedAt);
    const startedAtIsValid =
      Number.isFinite(savedStartedAt) &&
      savedStartedAt <= now + 60_000 &&
      now - savedStartedAt <= MAX_SESSION_SECONDS * 1000;

    // Un borrador puede conservar las series durante días, pero su cronómetro
    // no debe bloquear el guardado al superar el límite de una sesión.
    return { state: init, startedAt: startedAtIsValid ? savedStartedAt : now };
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
  const totalWithData = useMemo(
    () =>
      day.exercises.reduce((total, ex) => {
        const rows = state[ex.rowId] ?? [];
        if (ex.category === "cardio") {
          return total + (rows[0]?.minutes.trim() ? 1 : 0);
        }
        return (
          total +
          rows.filter((row) => row.weight.trim() || row.reps.trim()).length
        );
      }, 0),
    [day.exercises, state],
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
    if (save.isPending) return;
    const sets: SaveSetInput[] = [];
    let ignoredCheckedRows = 0;
    for (const ex of day.exercises) {
      const rows = state[ex.rowId] ?? [];
      if (ex.category === "cardio") {
        const r = rows[0];
        if (r?.minutes.trim()) {
          const mins = parseInt(r.minutes, 10);
          if (!Number.isFinite(mins) || mins < 1 || mins > 1440) {
            window.alert("La duración de cardio debe estar entre 1 y 1440 minutos.");
            return;
          }
          sets.push({
            exerciseId: ex.exerciseId,
            set_number: 1,
            weight_kg: null,
            reps: null,
            rpe: null,
            duration_seconds: Number.isFinite(mins) ? mins * 60 : null,
            is_warmup: false,
          });
        } else if (r?.done) {
          ignoredCheckedRows += 1;
        }
        continue;
      }
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        const weightText = row.weight.trim();
        const repsText = row.reps.trim();
        const rpeText = row.rpe.trim();
        const hasTrainingData = Boolean(weightText || repsText);
        if (!hasTrainingData) {
          if (row.done) ignoredCheckedRows += 1;
          continue;
        }

        const weight = weightText
          ? Number(weightText.replace(",", "."))
          : null;
        const reps = repsText ? Number(repsText) : null;
        const rpe = rpeText ? Number(rpeText.replace(",", ".")) : null;

        if (weight !== null && (!Number.isFinite(weight) || weight < 0 || weight > 1000)) {
          window.alert("Revisa el peso: debe estar entre 0 y 1000 kg.");
          return;
        }
        if (
          reps !== null &&
          (!Number.isInteger(reps) || reps < 1 || reps > 1000)
        ) {
          window.alert("Revisa las repeticiones: deben ser un número entero entre 1 y 1000.");
          return;
        }
        if (rpe !== null && (!Number.isFinite(rpe) || rpe < 0 || rpe > 10)) {
          window.alert("El RPE debe estar entre 0 y 10.");
          return;
        }
        sets.push({
          exerciseId: ex.exerciseId,
          set_number: i + 1,
          weight_kg: weight,
          reps,
          rpe,
          duration_seconds: null,
          is_warmup: false,
        });
      }
    }
    if (sets.length === 0) {
      window.alert(
        "No hay ninguna serie con datos. Introduce al menos el peso o las repeticiones antes de finalizar.",
      );
      return;
    }
    const ignoredMessage = ignoredCheckedRows
      ? `\n\nSe ignorarán ${ignoredCheckedRows} ${ignoredCheckedRows === 1 ? "fila marcada" : "filas marcadas"} sin peso, repeticiones ni minutos.`
      : "";
    if (
      !window.confirm(
        `¿Terminar y guardar ${sets.length} ${sets.length === 1 ? "serie" : "series"} en tu perfil?${ignoredMessage}`,
      )
    )
      return;

    try {
      await save.mutateAsync({
        dayId: day.id,
        durationSeconds: Math.min(elapsed, MAX_SESSION_SECONDS),
        sets,
      });
      clearDraft();
      router.replace("/history");
      router.refresh();
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? String(error.message)
          : "";
      if (/session|auth|jwt/i.test(message)) {
        window.alert("Tu acceso ha caducado. Vuelve a iniciar sesión; el borrador seguirá guardado en este dispositivo.");
      } else if (/duration/i.test(message)) {
        window.alert("El cronómetro del borrador era demasiado antiguo. Recarga la página y vuelve a finalizar; tus series no se perderán.");
      } else if (/set|serie|invalid|22023/i.test(message)) {
        window.alert("Hay una serie con datos no válidos. Revisa peso, repeticiones y RPE; el borrador sigue guardado.");
      } else {
        window.alert("No se pudo guardar la sesión. El borrador no se ha perdido; comprueba la conexión y vuelve a intentarlo.");
      }
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
    <div className="flex flex-col gap-7">
      <div className="flex min-h-11 items-center justify-between border-b border-ink/20 pb-3">
        <Link href="/routines" className="kicker-accent">
          ← Salir del modo sesión
        </Link>
        <span className="border border-ink bg-inverse px-3 py-2 font-mono text-sm font-semibold tabular-nums text-[var(--inverse-text)]">
          {mm}:{ss}
        </span>
      </div>

      <div className="border-b border-ink pb-6">
        <p className="kicker-accent">Sesión en curso · {day.routineName}</p>
        <h1 className="mt-3 font-display text-[clamp(2.5rem,10vw,4.75rem)] font-black leading-[0.88] tracking-[-0.065em] text-ink">
          {day.name}
        </h1>
        <p className="mt-5 border-l-4 border-signal pl-3 font-mono text-[9px] font-semibold uppercase leading-5 tracking-[0.12em] text-ink-mute">
          Borrador automático · puedes salir y volver sin perder series
        </p>
      </div>

      {day.exercises.length === 0 ? (
        <p className="text-sm text-ink-mute">Este día no tiene ejercicios.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {day.exercises.map((ex) => (
            <ExerciseLogger
              key={ex.rowId}
              ex={ex}
              rows={state[ex.rowId] ?? []}
              onChange={(rows) => updateRows(ex.rowId, rows)}
              returnTo={`/workout/${day.id}`}
            />
          ))}
        </div>
      )}

      <div className="sticky bottom-[calc(12px+env(safe-area-inset-bottom))] z-20 border border-ink bg-inverse p-2 shadow-hero">
        <button
          onClick={onFinish}
          disabled={save.isPending}
          className="button-primary w-full"
        >
          {save.isPending
            ? "Guardando"
            : `Finalizar · ${totalWithData} ${totalWithData === 1 ? "serie" : "series"}`}
        </button>
        {totalDone > totalWithData && (
          <p className="px-2 pb-1 pt-2 text-center font-mono text-[8px] uppercase tracking-[0.08em] text-[#b8beb9]">
            Las filas vacías marcadas no se guardarán
          </p>
        )}
      </div>
      <button
        onClick={onDiscard}
        className="mx-auto min-h-11 -mt-3 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-mute transition hover:text-danger"
      >
        Descartar entreno
      </button>
    </div>
  );
}
