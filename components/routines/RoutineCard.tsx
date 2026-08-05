import Link from "next/link";
import type { RoutineListItem } from "@/lib/queries/routines";

export function RoutineCard({ r }: { r: RoutineListItem }) {
  const ownerLabel = r.is_shared ? "Rutina compartida" : r.is_active ? "Plan activo" : "Plan personal";
  return (
    <Link
      href={`/routines/${r.id}`}
      className="group grid min-h-[116px] grid-cols-[44px_1fr_auto] items-center gap-4 border-b border-ink/25 bg-transparent px-2 py-5 transition hover:bg-surface sm:px-4"
    >
      <span className={`flex h-10 w-10 items-center justify-center border font-mono text-[10px] font-bold ${r.is_shared ? "border-signal bg-signal text-white" : "border-ink bg-accent text-ink"}`}>
        {r.day_count.toString().padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-display text-xl font-extrabold tracking-[-0.04em] text-ink">
            {r.name}
          </span>
        </div>
        {r.description && (
          <p className="mt-0.5 truncate text-sm text-ink-mute">
            {r.description}
          </p>
        )}
        <p className="mt-2 font-mono text-[9px] font-semibold uppercase tracking-[0.13em] text-ink-mute">
          {ownerLabel} · {r.day_count} {r.day_count === 1 ? "día" : "días"}
        </p>
      </div>
      <span className="font-mono text-xl text-ink transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-press">
        ↗
      </span>
    </Link>
  );
}
