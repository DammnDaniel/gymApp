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
    <div className="flex flex-col gap-8">
      <div className="grid gap-5 border-b border-ink pb-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="kicker-accent">Identidad y medidas</p>
          <h1 className="page-title mt-3">Tu perfil.</h1>
        </div>
        <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-ink bg-inverse font-display text-2xl font-black text-[var(--inverse-text)]">
          {initial}
        </div>
        <div>
          <h2 className="font-display text-xl font-extrabold leading-none tracking-[-0.04em] text-ink">
            {name}
          </h2>
          <p className="mt-1 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-mute">@{profile?.username ?? "usuario"}</p>
        </div>
        </div>
      </div>

      <div className="border-l-4 border-signal bg-signal-soft px-4 py-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-mute">
          Cuenta protegida · {profile?.email ?? "sin email"}
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
