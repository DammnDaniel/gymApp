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
  const firstDay = days[0];
  const trainHref = firstDay ? `/workout/${firstDay.id}` : "/routines";

  const sections = [
    { href: "/exercises", title: "Biblioteca", desc: "Ejercicios, técnica y consejos" },
    { href: "/routines", title: "Rutinas", desc: "Tus días y ejercicios" },
    { href: "/progress", title: "Progreso", desc: "Cargas, récords y evolución" },
    { href: "/history", title: "Historial", desc: "Sesiones registradas · editar/borrar" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="kicker-accent">// Bienvenido de nuevo</p>
        <h1 className="mt-2 font-display text-[32px] font-extrabold leading-none tracking-tightd text-ink">
          {name}
        </h1>
      </div>

      <Link
        href={trainHref}
        className="group relative block overflow-hidden rounded-2xl border border-white/[0.07] bg-surface p-6 shadow-hero transition hover:-translate-y-0.5 hover:border-accent/20 active:scale-[0.99]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[var(--grain)]" />
        <div className="relative">
          <p className="font-mono text-[11px] uppercase tracking-kicker text-accent">
            // Siguiente sesión
          </p>
          <h2 className="mt-2 font-display text-[28px] font-extrabold leading-none tracking-tightd text-ink">
            {firstDay?.name ?? "Entrenar hoy"}
          </h2>
          <p className="mt-2 max-w-[30ch] text-sm text-ink-mute">
            {activeRoutine?.name
              ? `${activeRoutine.name} · registra cada serie sin perder el progreso.`
              : "Abre tu rutina y registra cada serie."}
          </p>
          <span className="mt-5 inline-flex h-11 items-center gap-2 rounded-md bg-accent px-5 font-mono text-[13px] font-semibold uppercase tracking-[0.04em] text-accent-ink shadow-glow">
            Empezar <span aria-hidden>→</span>
          </span>
        </div>
      </Link>

      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <span className="kicker">// Accesos rápidos</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group flex min-h-[104px] items-center justify-between rounded-xl border border-transparent bg-surface p-5 shadow-card transition hover:border-white/[0.07] hover:bg-surface-2"
            >
              <div>
                <div className="font-display text-base font-bold tracking-tightd text-ink">
                  {s.title}
                </div>
                <div className="mt-0.5 text-sm text-ink-mute">{s.desc}</div>
              </div>
              <span className="font-mono text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-accent">
                &gt;
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
