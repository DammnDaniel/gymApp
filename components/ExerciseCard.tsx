import Link from "next/link";
import type { ExerciseListItem } from "@/lib/queries/exercises";
import { esMuscle, esEquipment } from "@/lib/i18n";

export function ExerciseCard({ ex }: { ex: ExerciseListItem }) {
  const meta = esMuscle(ex.primary_muscles?.[0]) || esEquipment(ex.equipment);

  return (
    <Link
      href={`/exercises/${encodeURIComponent(ex.slug)}`}
      className="group relative flex flex-col overflow-hidden bg-surface transition hover:bg-bg-0"
    >
      <div className="aspect-square overflow-hidden border-b border-ink/15 bg-surface-3">
        {ex.image_start && (
          <img
            src={ex.image_start}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center bg-inverse font-mono text-xs text-[var(--inverse-text)] transition group-hover:bg-accent group-hover:text-ink" aria-hidden>↗</span>
      <div className="flex min-h-[86px] flex-col gap-1 p-3">
        <div className="line-clamp-2 font-display text-[15px] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink">
          {ex.name_es ?? ex.name}
        </div>
        <div className="mt-auto pt-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-mute">
          {meta}
        </div>
      </div>
    </Link>
  );
}
