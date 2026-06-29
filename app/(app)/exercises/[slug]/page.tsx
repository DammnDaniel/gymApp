import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExerciseGif } from "@/components/ExerciseGif";

export default async function ExerciseDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data: ex } = await supabase
    .from("exercises")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!ex) notFound();

  const meta = [ex.equipment, ex.level, ex.mechanic].filter(Boolean) as string[];
  const muscles: string[] = [
    ...(ex.primary_muscles ?? []),
    ...(ex.secondary_muscles ?? []),
  ];

  return (
    <article className="flex flex-col gap-6">
      <Link
        href="/exercises"
        className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Biblioteca
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{ex.name}</h1>
        {meta.length > 0 && (
          <p className="mt-1 text-sm capitalize text-zinc-500">
            {meta.join(" · ")}
          </p>
        )}
      </div>

      <ExerciseGif start={ex.image_start} end={ex.image_end} alt={ex.name} />

      {muscles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {muscles.map((m, i) => (
            <span
              key={`${m}-${i}`}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                i < (ex.primary_muscles?.length ?? 0)
                  ? "bg-lime-100 text-lime-900 dark:bg-lime-400/15 dark:text-lime-300"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {m}
            </span>
          ))}
        </div>
      )}

      {ex.instructions?.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Instrucciones
          </h2>
          <ol className="flex flex-col gap-3">
            {ex.instructions.map((step: string, i: number) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                <span className="shrink-0 font-semibold text-zinc-400">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {ex.tips && (
        <section className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-sm font-semibold">Consejos</h2>
          <p className="mt-1 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-300">
            {ex.tips}
          </p>
        </section>
      )}
    </article>
  );
}
