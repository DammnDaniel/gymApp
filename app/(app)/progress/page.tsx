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
import { PageIntro } from "@/components/PageIntro";

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
      <div className="flex flex-col gap-8">
        <PageIntro eyebrow="Rendimiento" title="La señal." description="Tu evolución aparece cuando registras sesiones." />
        <div className="panel p-8 text-center">
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
    <div className="flex flex-col gap-8">
      <PageIntro eyebrow="Rendimiento" title="La señal." description="Compara cargas, volumen y fuerza estimada sin ruido." />

      <div className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="field sm:max-w-md"
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
                  ? "min-h-10 border border-ink bg-inverse px-3 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--inverse-text)]"
                  : "min-h-10 border border-border bg-bg-0 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-mute"
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 border-l border-t border-ink sm:grid-cols-4">
        {stats.map((s, index) => (
          <div key={s.label} className="relative min-h-[116px] border-b border-r border-ink bg-surface p-4">
            <span className="absolute right-3 top-3 font-mono text-[8px] font-bold text-accent-press">0{index + 1}</span>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl font-black tabular-nums tracking-[-0.05em] text-ink">
                {s.value}
              </span>
              {s.unit && (
                <span className="font-mono text-[11px] text-ink-faint">
                  {s.unit}
                </span>
              )}
            </div>
            <div className="mt-3 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-mute">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="panel p-4 sm:p-6">
        <p className="mb-5 rule-label">e1RM estimado</p>
        {mounted && prog && prog.points.length > 1 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={prog.points}
              margin={{ top: 5, right: 8, bottom: 0, left: -16 }}
            >
              <CartesianGrid stroke="#c4c7bd" vertical={false} />
              <XAxis
                dataKey="day"
                tickFormatter={(d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`}
                stroke="#535c58"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: "#c4c7bd" }}
              />
              <YAxis
                stroke="#535c58"
                fontSize={10}
                width={40}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#151b1a",
                  border: "1px solid #151b1a",
                  borderRadius: 0,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#b9c0bc" }}
                itemStyle={{ color: "#ff6138" }}
                formatter={(v: number) => [`${v} kg`, "e1RM"]}
              />
              <Line
                type="monotone"
                dataKey="e1rm"
                stroke="#ff6138"
                strokeWidth={3}
                dot={{ r: 3, fill: "#ff6138", strokeWidth: 0 }}
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
