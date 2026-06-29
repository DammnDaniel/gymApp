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

  const tiles = [
    { href: "/routines", title: "Rutinas", desc: "Tus días y ejercicios" },
    { href: "/exercises", title: "Biblioteca", desc: "Catálogo de ejercicios" },
    { href: "/progress", title: "Progreso", desc: "Gráficos y récords" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hola, {name} 💪</h1>
        <p className="text-neutral-500">¿Listo para entrenar hoy?</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-xl border border-neutral-200 p-4 transition hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
          >
            <div className="font-semibold">{t.title}</div>
            <div className="text-sm text-neutral-500">{t.desc}</div>
          </Link>
        ))}
      </div>

      <p className="text-xs text-neutral-400">
        Rutinas, biblioteca y progreso llegan en las próximas fases.
      </p>
    </div>
  );
}
