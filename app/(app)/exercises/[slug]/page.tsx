import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExerciseGif } from "@/components/ExerciseGif";
import { esMuscle, esEquipment, esLevel, esMechanic } from "@/lib/i18n";

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

  const meta = [esEquipment(ex.equipment), esLevel(ex.level), esMechanic(ex.mechanic)]
    .filter(Boolean)
    .join(" · ");
  const primary: string[] = ex.primary_muscles ?? [];
  const secondary: string[] = ex.secondary_muscles ?? [];
  const title: string = ex.name_es ?? ex.name;
  const instructions: string[] =
    ex.instructions_es?.length ? ex.instructions_es : (ex.instructions ?? []);

  return (
    <article className="flex flex-col gap-6">
      <Link href="/exercises" className="kicker-accent">
        &lt; Biblioteca
      </Link>

      <div>
        <h1 className="font-display text-[26px] font-extrabold leading-tight tracking-tightd text-ink">
          {title}
        </h1>
        {meta && (
          <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-mute">
            {meta}
          </p>
        )}
      </div>

      <ExerciseGif start={ex.image_start} end={ex.image_end} alt={ex.name} />

      <a
        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
          `${title} técnica`,
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-surface-2 px-5 font-mono text-[12px] font-semibold uppercase tracking-[0.04em] text-ink transition hover:border-border-strong hover:bg-surface-3"
      >
        ▶ Ver técnica en YouTube
      </a>

      {(primary.length > 0 || secondary.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {primary.map((m) => (
            <span
              key={`p-${m}`}
              className="inline-flex items-center rounded-sm border border-accent/30 bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent"
            >
              {esMuscle(m)}
            </span>
          ))}
          {secondary.map((m) => (
            <span
              key={`s-${m}`}
              className="inline-flex items-center rounded-sm border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink-mute"
            >
              {esMuscle(m)}
            </span>
          ))}
        </div>
      )}

      {instructions.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="kicker">// Instrucciones</h2>
          <ol className="flex flex-col gap-3">
            {instructions.map((step: string, i: number) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-surface-2 font-display text-sm font-extrabold tabular-nums text-accent">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-[15px] leading-relaxed text-ink">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {ex.tips && (
        <section className="rounded-md border-l-[3px] border-accent bg-surface-2 p-4">
          <h2 className="kicker">// Consejos</h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink">{ex.tips}</p>
        </section>
      )}
    </article>
  );
}
