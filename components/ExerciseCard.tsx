import Link from "next/link";
import type { ExerciseListItem } from "@/lib/queries/exercises";
import { esMuscle, esEquipment } from "@/lib/i18n";

export function ExerciseCard({ ex }: { ex: ExerciseListItem }) {
  const meta = esMuscle(ex.primary_muscles?.[0]) || esEquipment(ex.equipment);

  return (
    <Link
      href={`/exercises/${encodeURIComponent(ex.slug)}`}
      className="group flex flex-col overflow-hidden rounded-lg bg-surface shadow-card transition hover:bg-surface-2"
    >
      <div className="aspect-square overflow-hidden bg-surface-3">
        {ex.image_start && (
          <img
            src={ex.image_start}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <div className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink">
          {ex.name}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-mute">
          {meta}
        </div>
      </div>
    </Link>
  );
}
