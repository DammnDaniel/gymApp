"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ProfileEditor({
  userId,
  initialName,
  initialUnits,
  initialWeight,
}: {
  userId: string;
  initialName: string;
  initialUnits: "metric" | "imperial";
  initialWeight: number | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [units, setUnits] = useState(initialUnits);
  const [weight, setWeight] = useState(initialWeight?.toString() ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingWeight, setSavingWeight] = useState(false);
  const [message, setMessage] = useState("");

  async function saveProfile() {
    const cleanName = name.trim();
    if (!cleanName || cleanName.length > 80) {
      setMessage("Escribe un nombre válido.");
      return;
    }
    setSavingProfile(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: cleanName, unit_system: units })
      .eq("id", userId);
    setSavingProfile(false);
    setMessage(error ? "No se pudo guardar el perfil." : "Perfil guardado.");
    if (!error) router.refresh();
  }

  async function saveWeight() {
    const value = Number.parseFloat(weight.replace(",", "."));
    const kg = units === "imperial" ? value * 0.45359237 : value;
    if (!Number.isFinite(kg) || kg < 20 || kg > 400) {
      setMessage("Introduce un peso válido.");
      return;
    }
    setSavingWeight(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.from("bodyweight_logs").upsert(
      {
        owner_id: userId,
        measured_at: new Date().toISOString().slice(0, 10),
        weight_kg: Math.round(kg * 100) / 100,
      },
      { onConflict: "owner_id,measured_at" },
    );
    setSavingWeight(false);
    setMessage(error ? "No se pudo registrar el peso." : "Peso registrado.");
    if (!error) router.refresh();
  }

  const inputClass =
    "mt-2 h-11 w-full rounded-md border border-border bg-surface-3 px-3 text-sm text-ink outline-none transition focus:border-accent/50 focus:shadow-focusring";

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <p className="kicker">// Datos del perfil</p>
        <label className="mt-4 block text-sm text-ink-mute">
          Nombre visible
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            className={inputClass}
          />
        </label>
        <label className="mt-4 block text-sm text-ink-mute">
          Unidades
          <select
            value={units}
            onChange={(event) =>
              setUnits(event.target.value as "metric" | "imperial")
            }
            className={inputClass}
          >
            <option value="metric">Métrico · kg</option>
            <option value="imperial">Imperial · lb</option>
          </select>
        </label>
        <button
          onClick={saveProfile}
          disabled={savingProfile}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-accent px-5 font-mono text-[12px] font-semibold uppercase text-accent-ink shadow-glow disabled:opacity-50"
        >
          {savingProfile ? "Guardando" : "Guardar perfil"}
        </button>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <p className="kicker">// Peso corporal</p>
        <p className="mt-2 text-sm text-ink-mute">
          Añade una medición para verla en Progreso.
        </p>
        <div className="mt-3 flex items-end gap-3">
          <label className="min-w-0 flex-1 text-sm text-ink-mute">
            Peso actual
            <input
              inputMode="decimal"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              placeholder="—"
              className={inputClass}
            />
          </label>
          <span className="pb-3 font-mono text-xs uppercase text-ink-mute">
            {units === "imperial" ? "lb" : "kg"}
          </span>
        </div>
        <button
          onClick={saveWeight}
          disabled={savingWeight}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md border border-border-strong bg-surface-2 px-5 font-mono text-[12px] font-semibold uppercase text-ink transition hover:border-accent/40 disabled:opacity-50"
        >
          {savingWeight ? "Registrando" : "Registrar peso"}
        </button>
      </section>

      {message && (
        <p className="text-center text-sm text-ink-mute" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
