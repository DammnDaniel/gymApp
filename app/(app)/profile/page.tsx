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

  const name = profile?.display_name || profile?.username || "Atleta";
  const initial = name.charAt(0).toUpperCase();

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
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-surface-3 font-display text-xl font-extrabold text-ink">
          {initial}
        </div>
        <div>
          <p className="kicker">// Perfil</p>
          <h1 className="font-display text-2xl font-extrabold leading-none tracking-tightd text-ink">
            {name}
          </h1>
        </div>
      </div>

      <dl className="overflow-hidden rounded-lg bg-surface shadow-card">
        {rows.map((r, i) => (
          <div
            key={r.label}
            className={`flex items-center justify-between px-5 py-4 ${
              i > 0 ? "border-t border-border" : ""
            }`}
          >
            <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-mute">
              {r.label}
            </dt>
            <dd className="text-sm font-medium text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>

      <p className="text-sm text-ink-faint">
        Editar nombre y unidades, y registrar peso corporal: más adelante.
      </p>
    </div>
  );
}
