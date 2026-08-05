"use client";

import { MUSCLE_OPTIONS, EQUIPMENT_OPTIONS } from "@/lib/i18n";

export function ExerciseFilters({
  q,
  muscle,
  equipment,
  onQ,
  onMuscle,
  onEquipment,
}: {
  q: string;
  muscle: string;
  equipment: string;
  onQ: (v: string) => void;
  onMuscle: (v: string) => void;
  onEquipment: (v: string) => void;
}) {
  return (
    <div className="panel flex flex-col gap-4 p-4 sm:p-5">
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2" />
        </svg>
        <input
          type="text"
          placeholder="Buscar ejercicio…"
          value={q}
          onChange={(e) => onQ(e.target.value)}
          className="field pl-11"
        />
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5">
        <Chip selected={muscle === ""} onClick={() => onMuscle("")}>
          Todos
        </Chip>
        {MUSCLE_OPTIONS.map((m) => (
          <Chip
            key={m.value}
            selected={muscle === m.value}
            onClick={() => onMuscle(muscle === m.value ? "" : m.value)}
          >
            {m.label}
          </Chip>
        ))}
      </div>

      <select
        value={equipment}
        onChange={(e) => onEquipment(e.target.value)}
        className="field min-h-11 text-sm"
      >
        <option value="">Todo el equipo</option>
        {EQUIPMENT_OPTIONS.map((e) => (
          <option key={e.value} value={e.value}>
            {e.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        selected
          ? "inline-flex min-h-10 shrink-0 items-center border border-ink bg-inverse px-3 text-xs font-semibold text-[var(--inverse-text)] transition active:translate-y-px"
          : "inline-flex min-h-10 shrink-0 items-center border border-border bg-bg-0 px-3 text-xs font-medium text-ink-mute transition hover:border-ink hover:text-ink active:translate-y-px"
      }
    >
      {children}
    </button>
  );
}
