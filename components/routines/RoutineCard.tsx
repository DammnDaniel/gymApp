import Link from "next/link";
import type { RoutineListItem } from "@/lib/queries/routines";

export function RoutineCard({ r }: { r: RoutineListItem }) {
  return (
    <Link
      href={`/routines/${r.id}`}
      className="group flex items-center justify-between rounded-lg bg-surface p-5 shadow-card transition hover:bg-surface-2"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {r.is_active && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          )}
          <span className="truncate font-display text-base font-bold tracking-tightd text-ink">
            {r.name}
          </span>
        </div>
        {r.description && (
          <p className="mt-0.5 truncate text-sm text-ink-mute">
            {r.description}
          </p>
        )}
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
          {r.day_count} {r.day_count === 1 ? "día" : "días"}
        </p>
      </div>
      <span className="font-mono text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-accent">
        &gt;
      </span>
    </Link>
  );
}
