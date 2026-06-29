import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, email, unit_system")
    .eq("id", user!.id)
    .single();

  const rows = [
    { label: "Usuario", value: profile?.username ?? "—" },
    { label: "Nombre", value: profile?.display_name ?? "—" },
    { label: "Email", value: profile?.email ?? "—" },
    {
      label: "Unidades",
      value: profile?.unit_system === "imperial" ? "Imperial (lb)" : "Métrico (kg)",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>

      <dl className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        {rows.map((r, i) => (
          <div
            key={r.label}
            className={`flex items-center justify-between px-5 py-4 ${
              i > 0 ? "border-t border-zinc-200 dark:border-zinc-800" : ""
            }`}
          >
            <dt className="text-sm text-zinc-500">{r.label}</dt>
            <dd className="font-medium">{r.value}</dd>
          </div>
        ))}
      </dl>

      <p className="text-sm text-zinc-400">
        Editar nombre y unidades, y registrar peso corporal: más adelante.
      </p>
    </div>
  );
}
