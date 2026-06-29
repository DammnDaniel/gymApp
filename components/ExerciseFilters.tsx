"use client";

const MUSCLES = [
  "abdominals",
  "biceps",
  "calves",
  "chest",
  "forearms",
  "glutes",
  "hamstrings",
  "lats",
  "lower back",
  "middle back",
  "quadriceps",
  "shoulders",
  "traps",
  "triceps",
];

const EQUIPMENT = [
  "barbell",
  "dumbbell",
  "cable",
  "machine",
  "body only",
  "kettlebells",
  "bands",
  "exercise ball",
  "medicine ball",
];

const selectCls =
  "rounded-xl border border-zinc-200 bg-transparent px-3 py-2.5 text-sm capitalize outline-none transition focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-300";

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
    <div className="flex flex-col gap-2">
      <input
        type="text"
        placeholder="Buscar ejercicio…"
        value={q}
        onChange={(e) => onQ(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 bg-transparent px-4 py-3 text-base outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-lime-400/40 dark:border-zinc-800 dark:focus:border-zinc-300"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={muscle}
          onChange={(e) => onMuscle(e.target.value)}
          className={selectCls}
        >
          <option value="">Músculo</option>
          {MUSCLES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={equipment}
          onChange={(e) => onEquipment(e.target.value)}
          className={selectCls}
        >
          <option value="">Equipo</option>
          {EQUIPMENT.map((eq) => (
            <option key={eq} value={eq}>
              {eq}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
