"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useExerciseProgress,
  useExercisesWithLogs,
} from "@/lib/queries/progress";

const RANGES = [
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "Todo", days: 0 },
];

export default function ProgressPage() {
  const { data: exercises, isLoading } = useExercisesWithLogs();
  const [selected, setSelected] = useState("");
  const [days, setDays] = useState(90);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (exercises && exercises.length && !selected)
      setSelected(exercises[0].exercise_id);
  }, [exercises, selected]);

  const { data: prog } = useExerciseProgress(selected, days);

  if (!isLoading && exercises && exercises.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="kicker">// Progreso</p>
        <div className="rounded-lg bg-surface p-6 text-center shadow-card">
          <p className="text-ink-mute">Aún no hay datos.</p>
          <p className="mt-1 text-sm text-ink-faint">
            Registra una sesión de entreno y tu progreso aparecerá aquí.
          </p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "PR e1RM", value: prog ? `${prog.prE1rm}` : "—", unit: "kg" },
    { label: "Mejor peso", value: prog ? `${prog.bestWeight}` : "—", unit: "kg" },
    { label: "Sesiones", value: prog ? `${prog.sessions}` : "—", unit: "" },
    {
      label: "Tonelaje",
      value: prog ? `${(prog.totalVolume / 1000).toFixed(1)}` : "—",
      unit: "t",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <p className="kicker">// Progreso</p>

      <div className="flex flex-col gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="h-12 rounded-md border border-border bg-surface-2 px-3 text-[16px] text-ink outline-none focus:border-transparent focus:bg-surface-3 focus:shadow-focusring"
        >
          {(exercises ?? []).map((ex) => (
            <option key={ex.exercise_id} value={ex.exercise_id}>
              {ex.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={
                days === r.days
                  ? "rounded-sm border border-accent/30 bg-accent-soft px-3 py-1.5 font-mono text-xs uppercase tracking-[0.06em] text-accent"
                  : "rounded-sm border border-border bg-surface-2 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.06em] text-ink-mute"
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-surface p-4 shadow-card">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-2xl font-extrabold tabular-nums text-ink">
                {s.value}
              </span>
              {s.unit && (
                <span className="font-mono text-[11px] text-ink-faint">
                  {s.unit}
                </span>
              )}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-mute">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-surface p-4 shadow-card">
        <p className="mb-3 kicker">// e1RM estimado</p>
        {mounted && prog && prog.points.length > 1 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={prog.points}
              margin={{ top: 5, right: 8, bottom: 0, left: -16 }}
            >
              <CartesianGrid stroke="#262A30" vertical={false} />
              <XAxis
                dataKey="day"
                tickFormatter={(d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`}
                stroke="#5B6068"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: "#262A30" }}
              />
              <YAxis
                stroke="#5B6068"
                fontSize={10}
                width={40}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#1B1E22",
                  border: "1px solid #262A30",
                  borderRadius: 10,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#9AA0A6" }}
                itemStyle={{ color: "#D8FF3E" }}
                formatter={(v: number) => [`${v} kg`, "e1RM"]}
              />
              <Line
                type="monotone"
                dataKey="e1rm"
                stroke="#D8FF3E"
                strokeWidth={2}
                dot={{ r: 3, fill: "#D8FF3E", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[180px] items-center justify-center text-center font-mono text-[11px] uppercase tracking-kicker text-ink-faint">
            {prog && prog.points.length === 1
              ? "Solo una sesión todavía"
              : "Sin datos en este rango"}
          </div>
        )}
      </div>
    </div>
  );
}
