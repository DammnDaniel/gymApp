// Seed de las 2 rutinas reales (idempotente: delete-then-recreate por owner+nombre).
// Ejecutar:  npm run db:seed:routines
// Env opcional: OWNER_EL (def. daniel), OWNER_ELLA (def. ELENA). Usa SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

function parseEnv(file) {
  const out = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const env = parseEnv(".env.local");
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

const OWNER_EL = (process.env.OWNER_EL || "daniel").trim();
const OWNER_ELLA = (process.env.OWNER_ELLA || "ELENA").trim();

// Día de cardio compartido (catálogo cardio; sin series/reps, duración en notes).
const CARDIO_DAY = {
  name: "Cardio (opcional · 2-3×/semana)",
  focus: "Base suave para recuperar forma y para el fondo de combate/pole",
  exercises: [
    ["Jogging_Treadmill", null, null, null, "20-35 min a ritmo cómodo (puedes hablar). Elige UNA opción de este día."],
    ["Bicycling_Stationary", null, null, null, "Alternativa a la cinta. 20-35 min suave."],
    ["Elliptical_Trainer", null, null, null, "Alternativa de bajo impacto. 20-35 min suave."],
  ],
};

// e=[slug, sets, repsMin, repsMax, notes]  ·  movilidad: slug=null (custom)
const ROUTINES = [
  {
    username: OWNER_EL,
    name: "Entreno · Él",
    description: "Foco espalda, completo. Compagina con BJJ/MMA.",
    days: [
      {
        name: "Día 1 — Espalda y bíceps",
        focus: "Tirón · día principal",
        exercises: [
          ["Wide-Grip_Lat_Pulldown", 4, 6, 10, "Dominadas si te salen."],
          ["Leverage_Iso_Row", 4, 8, 12, ""],
          ["Close-Grip_Front_Lat_Pulldown", 3, 10, 12, ""],
          ["Straight-Arm_Dumbbell_Pullover", 3, 12, 15, ""],
          ["Seated_Bent-Over_Rear_Delt_Raise", 3, 15, 20, ""],
          ["Barbell_Curl", 3, 8, 12, ""],
          ["Hammer_Curls", 3, 10, 12, ""],
        ],
      },
      {
        name: "Día 2 — Pecho, hombro y tríceps",
        focus: "Empuje",
        exercises: [
          ["Machine_Bench_Press", 4, 6, 10, ""],
          ["Leverage_Shoulder_Press", 3, 8, 12, ""],
          ["Butterfly", 3, 10, 15, ""],
          ["Side_Lateral_Raise", 3, 12, 20, ""],
          ["Parallel_Bar_Dip", 3, 8, 12, ""],
          ["Triceps_Pushdown", 3, 12, 15, ""],
          ["Hanging_Leg_Raise", 3, 10, 15, ""],
        ],
      },
      {
        name: "Día 3 — Pierna y core",
        focus: "Una sesión de pierna",
        exercises: [
          ["Leg_Press", 4, 8, 12, ""],
          ["Lying_Leg_Curls", 3, 10, 12, ""],
          ["Leg_Extensions", 3, 12, 15, ""],
          ["Barbell_Hip_Thrust", 3, 10, 12, ""],
          ["Standing_Calf_Raises", 4, 12, 20, ""],
          ["Pallof_Press", 3, null, null, "30-45 s por lado. Core anti-rotación."],
        ],
      },
      {
        name: "Día 4 — Espalda 2 + agarre",
        focus: "Énfasis (opcional)",
        exercises: [
          ["Seated_Cable_Rows", 4, 8, 12, ""],
          ["Wide-Grip_Lat_Pulldown", 3, 10, 12, ""],
          ["One-Arm_Dumbbell_Row", 3, 10, 12, "Por lado."],
          ["Seated_Bent-Over_Rear_Delt_Raise", 3, 15, 20, ""],
          ["Farmers_Walk", 3, null, null, "20-30 s por vuelta."],
          ["Dumbbell_Alternate_Bicep_Curl", 3, 10, 12, ""],
          ["Palms-Up_Barbell_Wrist_Curl_Over_A_Bench", 3, 12, 15, ""],
        ],
      },
      CARDIO_DAY,
    ],
  },
  {
    username: OWNER_ELLA,
    name: "Entreno · Ella",
    description: "Completo con ápice de glúteo. Practica pole.",
    movilidadName: "Movilidad de cadera y espalda",
    days: [
      {
        name: "Día 1 — Tren inferior",
        focus: "Pierna completa · ápice glúteo",
        exercises: [
          ["Leg_Press", 3, 10, 12, ""],
          ["Barbell_Hip_Thrust", 3, 10, 12, ""],
          ["Lying_Leg_Curls", 3, 10, 12, ""],
          ["Leg_Extensions", 3, 12, 15, ""],
          ["Thigh_Abductor", 3, 15, 20, ""],
          ["Standing_Calf_Raises", 3, 15, 20, ""],
        ],
      },
      {
        name: "Día 2 — Tren superior A",
        focus: "Énfasis espalda + bíceps",
        exercises: [
          ["Pullups", 4, 8, 12, ""],
          ["Seated_Cable_Rows", 3, 10, 12, ""],
          ["Leverage_Shoulder_Press", 3, 10, 12, ""],
          ["Side_Lateral_Raise", 3, 12, 15, ""],
          ["Barbell_Curl", 3, 10, 12, ""],
          ["Side_Bridge", 3, null, null, "3 series. Core."],
        ],
      },
      {
        name: "Día 3 — Tren inferior 2",
        focus: "Pierna completa, otro ángulo",
        exercises: [
          ["Smith_Single-Leg_Split_Squat", 3, 10, 12, "Por pierna."],
          ["Romanian_Deadlift", 3, 8, 12, ""],
          ["Leg_Press", 3, 10, 12, ""],
          ["Glute_Kickback", 3, 15, 15, ""],
          ["Standing_Calf_Raises", 3, 15, 20, ""],
          ["Hanging_Leg_Raise", 3, 12, 15, ""],
        ],
      },
      {
        name: "Día 4 — Tren superior B",
        focus: "Hombro/pecho + tríceps + core",
        exercises: [
          ["One-Arm_Dumbbell_Row", 4, 8, 12, "Por lado."],
          ["Butterfly", 3, 12, 15, ""],
          ["Side_Lateral_Raise", 3, 12, 15, ""],
          ["Triceps_Pushdown", 3, 12, 15, ""],
          ["Hammer_Curls", 3, 10, 12, ""],
          ["Ab_Roller", 3, null, null, "3 series. Core fuerte."],
          [null, null, null, null, "5-10 min de estiramientos."],
        ],
      },
      CARDIO_DAY,
    ],
  },
];

for (const routine of ROUTINES) {
  console.log(`\n── ${routine.name} (@${routine.username}) ──`);

  const { data: prof, error: pErr } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", routine.username)
    .maybeSingle();
  if (pErr || !prof) {
    console.error(`  Usuario '${routine.username}' no encontrado. Saltando.`);
    continue;
  }
  const ownerId = prof.id;

  let movilidadId = null;
  const usesMovilidad = routine.days.some((d) =>
    d.exercises.some((e) => e[0] === null),
  );
  if (usesMovilidad) {
    const slug = `custom-movilidad-${routine.username.toLowerCase()}`;
    const { data: cust, error: cErr } = await supabase
      .from("exercises")
      .upsert(
        {
          slug,
          name: routine.movilidadName ?? "Movilidad",
          is_custom: true,
          owner_id: ownerId,
          category: "stretching",
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (cErr) {
      console.error("  Error creando ejercicio de movilidad:", cErr.message);
      continue;
    }
    movilidadId = cust.id;
  }

  const slugs = [
    ...new Set(
      routine.days.flatMap((d) =>
        d.exercises.map((e) => e[0]).filter((s) => s !== null),
      ),
    ),
  ];
  const { data: cat, error: catErr } = await supabase
    .from("exercises")
    .select("id, slug")
    .in("slug", slugs);
  if (catErr) {
    console.error("  Error resolviendo slugs:", catErr.message);
    continue;
  }
  const slugToId = new Map(cat.map((r) => [r.slug, r.id]));
  const missing = slugs.filter((s) => !slugToId.has(s));
  if (missing.length) {
    console.error("  Faltan slugs en el catálogo:", missing.join(", "));
    continue;
  }

  // idempotencia: borrar rutina(s) previas con mismo owner + nombre (cascada)
  const { error: delErr } = await supabase
    .from("routines")
    .delete()
    .eq("owner_id", ownerId)
    .eq("name", routine.name);
  if (delErr) {
    console.error("  Error borrando rutina previa:", delErr.message);
    continue;
  }

  const routineId = randomUUID();
  const { error: rErr } = await supabase.from("routines").insert({
    id: routineId,
    owner_id: ownerId,
    name: routine.name,
    description: routine.description,
    is_active: true,
  });
  if (rErr) {
    console.error("  Error insertando rutina:", rErr.message);
    continue;
  }

  const dayRows = [];
  const exRows = [];
  routine.days.forEach((day, di) => {
    const dayId = randomUUID();
    dayRows.push({
      id: dayId,
      routine_id: routineId,
      position: di,
      name: day.name,
      focus: day.focus,
    });
    day.exercises.forEach((e, ei) => {
      const exerciseId = e[0] === null ? movilidadId : slugToId.get(e[0]);
      exRows.push({
        id: randomUUID(),
        day_id: dayId,
        exercise_id: exerciseId,
        position: ei,
        target_sets: e[1],
        target_reps_min: e[2],
        target_reps_max: e[3],
        notes: e[4] || null,
      });
    });
  });

  const { error: dErr } = await supabase.from("routine_days").insert(dayRows);
  if (dErr) {
    console.error("  Error insertando días:", dErr.message);
    continue;
  }
  const { error: eErr } = await supabase
    .from("routine_exercises")
    .insert(exRows);
  if (eErr) {
    console.error("  Error insertando ejercicios:", eErr.message);
    continue;
  }

  console.log(`  ✓ ${dayRows.length} días, ${exRows.length} ejercicios.`);
}

console.log("\n==> Seed de rutinas completado.");
