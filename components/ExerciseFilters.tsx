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
    <div className="flex flex-col gap-3">
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
          className="h-12 w-full rounded-md border border-border bg-surface-2 pl-11 pr-4 text-[16px] text-ink placeholder:text-ink-faint focus:border-transparent focus:bg-surface-3 focus:outline-none focus:shadow-focusring"
        />
      </div>

      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
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
        className="h-11 rounded-md border border-border bg-surface-2 px-3 text-sm text-ink outline-none focus:border-transparent focus:bg-surface-3 focus:shadow-focusring"
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
          ? "inline-flex shrink-0 items-center rounded-sm border border-accent/30 bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent transition active:scale-[0.96]"
          : "inline-flex shrink-0 items-center rounded-sm border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink-mute transition hover:text-ink active:scale-[0.96]"
      }
    >
      {children}
    </button>
  );
}
