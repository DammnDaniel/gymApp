import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", user!.id)
    .single();

  const name = profile?.display_name || profile?.username || "Atleta";
  const { data: activeRoutine } = await supabase
    .from("routines")
    .select("id, name, routine_days(id, name, position)")
    .eq("owner_id", user!.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const days = [...((activeRoutine as any)?.routine_days ?? [])].sort(
    (a: any, b: any) => a.position - b.position,
  );
  const { data: latestSession } = await supabase
    .from("workout_sessions")
    .select("routine_day_id, performed_at")
    .eq("owner_id", user!.id)
    .order("performed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const previousIndex = days.findIndex(
    (day: any) => day.id === latestSession?.routine_day_id,
  );
  const nextDay = days.length
    ? days[previousIndex >= 0 ? (previousIndex + 1) % days.length : 0]
    : null;
  const trainHref = nextDay ? `/workout/${nextDay.id}` : "/routines";

  const sections = [
    { href: "/routines", index: "01", title: "Plan", desc: "Consulta y ajusta cada día" },
    { href: "/exercises", index: "02", title: "Técnica", desc: "Movimientos y ejecución" },
    { href: "/progress", index: "03", title: "Progreso", desc: "Cargas, récords y volumen" },
    { href: "/history", index: "04", title: "Diario", desc: "Revisa y edita sesiones" },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-5 border-b border-ink pb-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="kicker-accent">Cuaderno de entrenamiento</p>
          <h1 className="page-title mt-3">Hola,<br />{name}.</h1>
        </div>
        <div className="w-fit border-l-4 border-signal pl-3 font-mono text-[10px] font-semibold uppercase leading-5 tracking-[0.12em] text-ink-mute">
          Próximo bloque<br />calculado por historial
        </div>
      </div>

      <Link
        href={trainHref}
        className="group relative block overflow-hidden border border-ink bg-inverse p-6 text-[var(--inverse-text)] shadow-hero transition hover:-translate-y-0.5 active:translate-y-0 sm:p-8"
      >
        <div className="pointer-events-none absolute inset-0 bg-[var(--grain)] bg-[length:28px_28px] opacity-20" />
        <div className="absolute right-0 top-0 h-16 w-16 bg-accent" aria-hidden />
        <div className="relative grid gap-7 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#aeb5b0]">
            Próxima sesión
          </p>
          <h2 className="mt-3 max-w-[12ch] font-display text-[clamp(2rem,8vw,4.1rem)] font-black leading-[0.9] tracking-[-0.06em]">
            {nextDay?.name ?? "Prepara tu plan"}
          </h2>
          <p className="mt-4 max-w-[36ch] text-sm leading-6 text-[#b9c0bc]">
            {activeRoutine?.name
              ? `${activeRoutine.name} · el borrador se guarda aunque salgas.`
              : "Crea una rutina para empezar a registrar tu trabajo."}
          </p>
          </div>
          <span className="inline-flex min-h-12 w-fit items-center gap-3 border border-accent bg-accent px-5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-accent-ink transition group-hover:bg-white">
            Abrir sesión <span className="text-base" aria-hidden>↗</span>
          </span>
        </div>
      </Link>

      <Link
        href="/coach"
        className="group grid gap-4 border border-ink bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:bg-white sm:grid-cols-[auto_1fr_auto] sm:items-center"
      >
        <span className="flex h-12 w-12 items-center justify-center bg-signal font-display text-xl font-black text-white">
          C
        </span>
        <div>
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-signal">
            Coach contextual
          </p>
          <h2 className="mt-1 font-display text-xl font-black tracking-[-0.04em] text-ink">
            Pregunta sobre tu rutina. Cambia solo lo que confirmes.
          </h2>
        </div>
        <span className="font-mono text-xl text-ink transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-press">
          ↗
        </span>
      </Link>

      <div>
        <div className="mb-4 flex items-baseline justify-between border-b border-ink/20 pb-3">
          <span className="rule-label">Índice</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-faint">Edición actual</span>
        </div>
        <div className="grid grid-cols-1 border-t border-ink sm:grid-cols-2">
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group grid min-h-[112px] grid-cols-[36px_1fr_auto] items-center gap-3 border-b border-ink/25 bg-transparent p-4 transition hover:bg-surface sm:odd:border-r"
            >
              <span className="self-start pt-1 font-mono text-[9px] font-semibold text-accent-press">{s.index}</span>
              <div>
                <div className="font-display text-lg font-extrabold tracking-[-0.04em] text-ink">
                  {s.title}
                </div>
                <div className="mt-1 text-sm text-ink-mute">{s.desc}</div>
              </div>
              <span className="font-mono text-xl text-ink transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-press">
                ↗
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
