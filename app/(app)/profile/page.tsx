import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, email, unit_system, created_at")
    .eq("id", user!.id)
    .single();

  const rows: { label: string; value: string }[] = [
    { label: "Usuario", value: profile?.username ?? "—" },
    { label: "Nombre visible", value: profile?.display_name ?? "—" },
    { label: "Email", value: profile?.email ?? "—" },
    {
      label: "Unidades",
      value: profile?.unit_system === "imperial" ? "Imperial (lb)" : "Métrico (kg)",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>

      <dl className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between px-4 py-3">
            <dt className="text-neutral-500">{r.label}</dt>
            <dd className="font-medium">{r.value}</dd>
          </div>
        ))}
      </dl>

      <p className="text-xs text-neutral-400">
        Editar nombre/unidades y registrar peso corporal: próximas fases.
      </p>
    </div>
  );
}
