"use client";

import Link from "next/link";
import type { WorkoutExercise } from "@/lib/queries/workouts";

export type SetRow = {
  weight: string;
  reps: string;
  rpe: string;
  minutes: string;
  done: boolean;
};

const inp =
  "w-full rounded-sm border border-border bg-surface-3 px-1 py-1.5 text-center font-mono text-[14px] tabular-nums text-ink outline-none focus:border-transparent focus:shadow-focusring";
const head =
  "text-center font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint";
const grid = "grid grid-cols-[24px_1fr_1fr_1fr_34px] items-center gap-2";

export function ExerciseLogger({
  ex,
  rows,
  onChange,
}: {
  ex: WorkoutExercise;
  rows: SetRow[];
  onChange: (rows: SetRow[]) => void;
}) {
  const name = ex.name_es ?? ex.name;
  const isCardio = ex.category === "cardio";
  const reps =
    ex.target_reps_min != null
      ? ex.target_reps_max != null
        ? `${ex.target_reps_min}-${ex.target_reps_max}`
        : `${ex.target_reps_min}`
      : null;
  const target = ex.target_sets
    ? `${ex.target_sets} series${reps ? ` · ${reps} reps` : ""}`
    : null;

  const update = (i: number, patch: Partial<SetRow>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const Header = (
    <div className="mb-3 flex items-center gap-3">
      <Link
        href={ex.slug ? `/exercises/${encodeURIComponent(ex.slug)}` : "#"}
        className="h-11 w-11 shrink-0 overflow-hidden rounded-sm bg-surface-3"
      >
        {ex.image_start && (
          <img src={ex.image_start} alt="" className="h-full w-full object-cover" />
        )}
      </Link>
      <div className="min-w-0">
        <div className="truncate font-display text-base font-bold tracking-tightd text-ink">
          {name}
        </div>
        {(target || isCardio) && (
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-mute">
            {isCardio ? "Cardio · duración" : target}
          </div>
        )}
      </div>
    </div>
  );

  if (isCardio) {
    const row = rows[0] ?? {
      weight: "",
      reps: "",
      rpe: "",
      minutes: "",
      done: false,
    };
    return (
      <section className="rounded-lg bg-surface p-4 shadow-card">
        {Header}
        {ex.notes && <p className="mb-3 text-xs text-ink-mute">{ex.notes}</p>}
        <div className="flex items-center gap-3">
          <input
            inputMode="numeric"
            value={row.minutes}
            onChange={(e) => onChange([{ ...row, minutes: e.target.value }])}
            placeholder="—"
            aria-label="Minutos"
            className="w-20 rounded-sm border border-border bg-surface-3 px-2 py-2 text-center font-mono text-base tabular-nums text-ink outline-none focus:border-transparent focus:shadow-focusring"
          />
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-mute">
            minutos
          </span>
          <button
            onClick={() => onChange([{ ...row, done: !row.done }])}
            aria-label="Marcar hecho"
            className={`ml-auto flex h-9 w-9 items-center justify-center rounded-sm border font-mono text-sm transition ${
              row.done
                ? "border-accent bg-accent text-accent-ink"
                : "border-border text-ink-faint hover:text-ink"
            }`}
          >
            ✓
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg bg-surface p-4 shadow-card">
      {Header}
      {ex.notes && <p className="mb-3 text-xs text-ink-mute">{ex.notes}</p>}

      <div className={`${grid} mb-1 px-1`}>
        <span className="text-center font-mono text-[10px] text-ink-faint">
          #
        </span>
        <span className={head}>Kg</span>
        <span className={head}>Reps</span>
        <span className={head}>RPE</span>
        <span />
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <div
            key={i}
            className={`${grid} rounded-md p-1 transition ${
              r.done ? "bg-accent-soft" : ""
            }`}
          >
            <span className="text-center font-mono text-[13px] tabular-nums text-ink-faint">
              {i + 1}
            </span>
            <input
              inputMode="decimal"
              value={r.weight}
              onChange={(e) => update(i, { weight: e.target.value })}
              placeholder="—"
              className={inp}
            />
            <input
              inputMode="numeric"
              value={r.reps}
              onChange={(e) => update(i, { reps: e.target.value })}
              placeholder="—"
              className={inp}
            />
            <input
              inputMode="decimal"
              value={r.rpe}
              onChange={(e) => update(i, { rpe: e.target.value })}
              placeholder="—"
              className={inp}
            />
            <button
              onClick={() => update(i, { done: !r.done })}
              aria-label="Marcar serie hecha"
              className={`flex h-8 w-8 items-center justify-center rounded-sm border font-mono text-sm transition ${
                r.done
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-border text-ink-faint hover:text-ink"
              }`}
            >
              ✓
            </button>
          </div>
        ))}
      </div>

      <div className="mt-2.5 flex justify-between">
        <button
          onClick={() =>
            onChange([
              ...rows,
              { weight: "", reps: "", rpe: "", minutes: "", done: false },
            ])
          }
          className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-mute transition hover:text-accent"
        >
          + Serie
        </button>
        {rows.length > 1 && (
          <button
            onClick={() => onChange(rows.slice(0, -1))}
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint transition hover:text-danger"
          >
            − Serie
          </button>
        )}
      </div>
    </section>
  );
}
