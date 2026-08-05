import { createClient } from "@/lib/supabase/server";
import { ProfileEditor } from "@/components/profile/ProfileEditor";

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
  const { data: latestWeight } = await supabase
    .from("bodyweight_logs")
    .select("weight_kg")
    .eq("owner_id", user!.id)
    .order("measured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const name = profile?.display_name || profile?.username || "Atleta";
  const initial = name.charAt(0).toUpperCase();

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

      <div className="rounded-xl border border-border bg-surface-2/70 px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
          @{profile?.username ?? "usuario"} · {profile?.email ?? "sin email"}
        </p>
      </div>

      <ProfileEditor
        userId={user!.id}
        initialName={name}
        initialUnits={profile?.unit_system === "imperial" ? "imperial" : "metric"}
        initialWeight={latestWeight?.weight_kg ?? null}
      />
    </div>
  );
}
