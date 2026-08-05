import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExerciseGif } from "@/components/ExerciseGif";
import { esMuscle, esEquipment, esLevel, esMechanic } from "@/lib/i18n";
import { returnLabel, safeReturnPath } from "@/lib/navigation";

export default async function ExerciseDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { from?: string | string[] };
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
  const returnTo = safeReturnPath(searchParams.from);

  return (
    <article className="flex flex-col gap-8">
      <Link href={returnTo} className="kicker-accent min-h-11 border-b border-ink/20 pb-3">
        ← {returnLabel(returnTo)}
      </Link>

      <div className="grid gap-6 md:grid-cols-[1fr_0.92fr] md:items-end">
        <div className="order-2 md:order-1">
          <p className="kicker-accent">Ficha de movimiento</p>
          <h1 className="mt-3 font-display text-[clamp(2.5rem,9vw,5rem)] font-black leading-[0.86] tracking-[-0.065em] text-ink">
            {title}
          </h1>
          {meta && (
            <p className="mt-5 border-l-4 border-signal pl-3 font-mono text-[9px] font-semibold uppercase leading-5 tracking-[0.12em] text-ink-mute">
              {meta}
            </p>
          )}
          <a
        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
          `${title} técnica`,
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="button-secondary mt-6 w-full sm:w-auto"
      >
        Ver vídeo de técnica <span aria-hidden>↗</span>
          </a>
        </div>
        <div className="order-1 md:order-2"><ExerciseGif start={ex.image_start} end={ex.image_end} alt={ex.name} /></div>
      </div>

      {(primary.length > 0 || secondary.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {primary.map((m) => (
            <span
              key={`p-${m}`}
              className="inline-flex min-h-9 items-center border border-ink bg-accent px-3 text-xs font-semibold text-ink"
            >
              {esMuscle(m)}
            </span>
          ))}
          {secondary.map((m) => (
            <span
              key={`s-${m}`}
              className="inline-flex min-h-9 items-center border border-border bg-surface px-3 text-xs font-medium text-ink-mute"
            >
              {esMuscle(m)}
            </span>
          ))}
        </div>
      )}

      {instructions.length > 0 && (
        <section className="flex flex-col gap-4 border-t border-ink pt-5">
          <h2 className="rule-label">Ejecución</h2>
          <ol className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {instructions.map((step: string, i: number) => (
              <li key={i} className="grid grid-cols-[32px_1fr] gap-3 border-b border-ink/15 pb-4">
                <span className="font-mono text-[10px] font-bold tabular-nums text-accent-press">
                  {String(i + 1).padStart(2, "0")}
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
        <section className="border border-ink bg-inverse p-5 text-[var(--inverse-text)]">
          <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">Clave técnica</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--inverse-text)]">{ex.tips}</p>
        </section>
      )}
    </article>
  );
}
