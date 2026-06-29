"use client";

import { useState } from "react";
import {
  useUpdateRoutineExercise,
  type RoutineExercise,
} from "@/lib/queries/routines";

const numCls =
  "w-12 rounded-sm border border-border bg-surface-3 px-1 py-1 text-center font-mono text-[13px] tabular-nums text-ink outline-none focus:border-transparent focus:shadow-focusring";

export function InlineSetsReps({
  routineId,
  dayId,
  re,
}: {
  routineId: string;
  dayId: string;
  re: RoutineExercise;
}) {
  const update = useUpdateRoutineExercise();
  const [sets, setSets] = useState(re.target_sets?.toString() ?? "");
  const [rmin, setRmin] = useState(re.target_reps_min?.toString() ?? "");
  const [rmax, setRmax] = useState(re.target_reps_max?.toString() ?? "");
  const [notes, setNotes] = useState(re.notes ?? "");

  const toNum = (v: string) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  };
  const save = (
    patch: Partial<
      Pick<
        RoutineExercise,
        "target_sets" | "target_reps_min" | "target_reps_max" | "notes"
      >
    >,
  ) => update.mutate({ routineId, dayId, rowId: re.id, patch });

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
      <input
        inputMode="numeric"
        value={sets}
        onChange={(e) => setSets(e.target.value)}
        onBlur={() => save({ target_sets: toNum(sets) })}
        placeholder="—"
        aria-label="Series"
        className={numCls}
      />
      <span className="font-mono text-[11px] text-ink-faint">×</span>
      <input
        inputMode="numeric"
        value={rmin}
        onChange={(e) => setRmin(e.target.value)}
        onBlur={() => save({ target_reps_min: toNum(rmin) })}
        placeholder="—"
        aria-label="Reps mínimas"
        className={numCls}
      />
      <span className="font-mono text-[11px] text-ink-faint">–</span>
      <input
        inputMode="numeric"
        value={rmax}
        onChange={(e) => setRmax(e.target.value)}
        onBlur={() => save({ target_reps_max: toNum(rmax) })}
        placeholder="—"
        aria-label="Reps máximas"
        className={numCls}
      />
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
        series · reps
      </span>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => save({ notes: notes.trim() === "" ? null : notes.trim() })}
        placeholder="Notas…"
        className="min-w-0 flex-1 basis-full rounded-sm border border-border bg-surface-3 px-2 py-1 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-transparent focus:shadow-focusring"
      />
    </div>
  );
}
