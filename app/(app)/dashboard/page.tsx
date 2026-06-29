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

  const name = profile?.display_name || profile?.username || "atleta";

  const sections = [
    { href: "/exercises", title: "Biblioteca", desc: "Explora ejercicios, técnica y consejos" },
    { href: "/routines", title: "Rutinas", desc: "Organiza tus días y ejercicios" },
    { href: "/progress", title: "Progreso", desc: "Cargas, récords y evolución" },
  ];

  return (
    <div className="flex flex-col gap-7">
      <div>
        <p className="text-sm text-zinc-500">Bienvenido de nuevo</p>
        <h1 className="text-3xl font-semibold tracking-tight">{name}</h1>
      </div>

      <Link
        href="/routines"
        className="group relative overflow-hidden rounded-2xl bg-zinc-900 p-6 text-white transition active:scale-[0.99] dark:bg-zinc-100 dark:text-zinc-900"
      >
        <div className="relative z-10">
          <div className="text-lg font-semibold">Entrenar hoy</div>
          <p className="mt-1 text-sm text-zinc-300 dark:text-zinc-600">
            Empieza tu próxima sesión
          </p>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-lime-400/25 blur-2xl" />
      </Link>

      <div className="flex flex-col gap-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex items-center justify-between rounded-2xl border border-zinc-200 px-5 py-4 transition hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
          >
            <div>
              <div className="font-medium">{s.title}</div>
              <div className="text-sm text-zinc-500">{s.desc}</div>
            </div>
            <span className="text-zinc-300 transition group-hover:translate-x-0.5 dark:text-zinc-600">
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
