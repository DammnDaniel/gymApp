"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  useDeleteSession,
  useDeleteSetLog,
  useSessionDetail,
  useUpdateSetLog,
  type SessionSetRow,
} from "@/lib/queries/workouts";

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

const inp =
  "w-full rounded-sm border border-border bg-surface-3 px-1 py-1.5 text-center font-mono text-[14px] tabular-nums text-ink outline-none focus:border-transparent focus:shadow-focusring";
const head =
  "text-center font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint";

export function SessionEditor({ id }: { id: string }) {
  const router = useRouter();
  const { data, isLoading, error } = useSessionDetail(id);
  const delSession = useDeleteSession();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-40 animate-pulse rounded bg-surface-3" />
        <div className="h-40 animate-pulse rounded-lg bg-surface-3" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/history" className="kicker-accent">
          &lt; Historial
        </Link>
        <p className="text-sm text-danger">No se pudo cargar la sesión.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link href="/history" className="kicker-accent">
          &lt; Historial
        </Link>
        <button
          onClick={() => {
            if (window.confirm("¿Borrar esta sesión entera?")) {
              delSession.mutate(data.id);
              router.replace("/history");
            }
          }}
          className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint transition hover:text-danger"
        >
          Borrar sesión
        </button>
      </div>

      <div>
        <p className="kicker">// {data.routineName ?? "Sesión"}</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tightd text-ink">
          {data.dayName ?? "Sesión"}
        </h1>
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
          {fmtDate(data.performed_at)}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {data.exercises.map((ex) => {
          const isCardio = ex.category === "cardio";
          return (
            <section
              key={ex.exerciseId}
              className="rounded-lg bg-surface p-4 shadow-card"
            >
              <div className="mb-3 font-display text-base font-bold tracking-tightd text-ink">
                {ex.name}
              </div>
              {!isCardio && (
                <div className="mb-1 grid grid-cols-[24px_1fr_1fr_1fr_34px] items-center gap-2 px-1">
                  <span className="text-center font-mono text-[10px] text-ink-faint">
                    #
                  </span>
                  <span className={head}>Kg</span>
                  <span className={head}>Reps</span>
                  <span className={head}>RPE</span>
                  <span />
                </div>
              )}
              <div className="flex flex-col gap-2">
                {ex.sets.map((s) => (
                  <EditableSet
                    key={s.id}
                    sessionId={data.id}
                    set={s}
                    isCardio={isCardio}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function EditableSet({
  sessionId,
  set,
  isCardio,
}: {
  sessionId: string;
  set: SessionSetRow;
  isCardio: boolean;
}) {
  const update = useUpdateSetLog();
  const delSet = useDeleteSetLog();
  const [weight, setWeight] = useState(set.weight_kg?.toString() ?? "");
  const [reps, setReps] = useState(set.reps?.toString() ?? "");
  const [rpe, setRpe] = useState(set.rpe?.toString() ?? "");
  const [mins, setMins] = useState(
    set.duration_seconds != null ? String(Math.round(set.duration_seconds / 60)) : "",
  );

  const numF = (v: string) => {
    const n = parseFloat(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };
  const numI = (v: string) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  };
  const save = (patch: Partial<SessionSetRow>) =>
    update.mutate({ sessionId, setId: set.id, patch });

  const DeleteBtn = (
    <button
      onClick={() => delSet.mutate({ sessionId, setId: set.id })}
      aria-label="Borrar serie"
      className="flex h-8 w-8 items-center justify-center rounded-sm border border-border font-mono text-sm text-ink-faint transition hover:text-danger"
    >
      ×
    </button>
  );

  if (isCardio) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-6 text-center font-mono text-[13px] tabular-nums text-ink-faint">
          {set.set_number}
        </span>
        <input
          inputMode="numeric"
          value={mins}
          onChange={(e) => setMins(e.target.value)}
          onBlur={() => {
            const m = numI(mins);
            save({ duration_seconds: m != null ? m * 60 : null });
          }}
          className="w-20 rounded-sm border border-border bg-surface-3 px-2 py-1.5 text-center font-mono text-[14px] tabular-nums text-ink outline-none focus:border-transparent focus:shadow-focusring"
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-mute">
          min
        </span>
        <span className="ml-auto">{DeleteBtn}</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[24px_1fr_1fr_1fr_34px] items-center gap-2">
      <span className="text-center font-mono text-[13px] tabular-nums text-ink-faint">
        {set.set_number}
      </span>
      <input
        inputMode="decimal"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={() => save({ weight_kg: numF(weight) })}
        placeholder="—"
        className={inp}
      />
      <input
        inputMode="numeric"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={() => save({ reps: numI(reps) })}
        placeholder="—"
        className={inp}
      />
      <input
        inputMode="decimal"
        value={rpe}
        onChange={(e) => setRpe(e.target.value)}
        onBlur={() => save({ rpe: numF(rpe) })}
        placeholder="—"
        className={inp}
      />
      {DeleteBtn}
    </div>
  );
}
