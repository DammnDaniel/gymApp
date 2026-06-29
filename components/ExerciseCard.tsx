import Link from "next/link";
import type { ExerciseListItem } from "@/lib/queries/exercises";

export function ExerciseCard({ ex }: { ex: ExerciseListItem }) {
  return (
    <Link
      href={`/exercises/${encodeURIComponent(ex.slug)}`}
      className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <div className="aspect-square overflow-hidden bg-white">
        {ex.image_start && (
          <img
            src={ex.image_start}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <div className="p-3">
        <div className="line-clamp-2 text-sm font-medium leading-snug">
          {ex.name}
        </div>
        <div className="mt-1 text-xs capitalize text-zinc-500">
          {ex.primary_muscles?.[0] ?? ex.equipment ?? ""}
        </div>
      </div>
    </Link>
  );
}
