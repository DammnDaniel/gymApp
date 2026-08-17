// Seed de las 2 rutinas reales.
// Sincroniza en el sitio para conservar IDs de rutinas/días y no romper el historial.
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

async function ensureSingleLegPress() {
  const { data: source, error: sourceError } = await supabase
    .from("exercises")
    .select(
      "force, level, mechanic, equipment, primary_muscles, secondary_muscles, category, image_start, image_end, video_url",
    )
    .eq("slug", "Leg_Press")
    .single();
  if (sourceError) throw sourceError;

  const values = {
    slug: "Single-Leg_Leg_Press",
    name: "Single-Leg Leg Press",
    name_es: "Prensa unilateral",
    force: source.force,
    level: source.level,
    mechanic: source.mechanic,
    equipment: source.equipment,
    primary_muscles: source.primary_muscles,
    secondary_muscles: source.secondary_muscles,
    instructions: [
      "Sit on the machine and place one foot in the center of the platform.",
      "Release the safety catches while keeping your back and hips supported.",
      "Lower the platform under control until reaching a comfortable depth.",
      "Push through the whole foot without locking the knee, then repeat on the other leg.",
    ],
    instructions_es: [
      "Siéntate y coloca un pie en el centro de la plataforma.",
      "Libera los seguros manteniendo la espalda y la cadera apoyadas.",
      "Baja de forma controlada hasta una profundidad cómoda.",
      "Empuja con todo el pie sin bloquear la rodilla y repite con la otra pierna.",
    ],
    category: source.category,
    image_start: source.image_start,
    image_end: source.image_end,
    video_url: source.video_url,
    tips: "Usa bastante menos peso que en la prensa bilateral. Mantén la rodilla alineada con el pie y no levantes la cadera del respaldo.",
    is_custom: false,
    owner_id: null,
  };

  const { data: existing, error: existingError } = await supabase
    .from("exercises")
    .select("id")
    .eq("slug", values.slug)
    .maybeSingle();
  if (existingError) throw existingError;

  const { error } = existing
    ? await supabase.from("exercises").update(values).eq("id", existing.id)
    : await supabase.from("exercises").insert({ id: randomUUID(), ...values });
  if (error) throw error;
}

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
    description: "Fuerza e hipertrofia compatibles con BJJ/MMA. Cuatro días coordinados con Elena, con énfasis en espalda y pierna.",
    days: [
      {
        name: "Día 1 — Tirón y bíceps",
        focus: "5 ejercicios compartidos · extra de antebrazo para Daniel",
        exercises: [
          ["Wide-Grip_Lat_Pulldown", 4, 6, 10, ""],
          ["Leverage_Iso_Row", 4, 8, 12, "Misma máquina que Elena; ajustad asiento y carga para cada uno."],
          ["Reverse_Machine_Flyes", 3, 12, 20, "Peck deck al revés: deltoide posterior. Misma máquina que pecho, ejecución distinta."],
          ["Barbell_Curl", 3, 8, 12, ""],
          ["Hammer_Curls", 2, 10, 12, ""],
          ["Reverse_Cable_Curl", 2, 10, 15, "Agarre prono. Controla la bajada; énfasis en braquiorradial y antebrazo."],
        ],
      },
      {
        name: "Día 2 — Pierna A",
        focus: "5 ejercicios compartidos · hip thrust incluido",
        exercises: [
          ["Leg_Press", 4, 8, 12, ""],
          ["Barbell_Hip_Thrust", 3, 8, 12, "Pausa un segundo arriba. Si el banco no es cómodo, pide al monitor que te coloque la barra."],
          ["Lying_Leg_Curls", 3, 10, 12, ""],
          ["Leg_Extensions", 3, 12, 15, ""],
          ["Standing_Calf_Raises", 3, 12, 20, ""],
          ["Pallof_Press", 3, null, null, "30-45 s por lado. Core anti-rotación."],
        ],
      },
      {
        name: "Día 3 — Empuje",
        focus: "5 ejercicios compartidos · extra de pecho y core para Daniel",
        exercises: [
          ["Leverage_Incline_Chest_Press", 4, 6, 10, "Ajusta el asiento para que las asas queden a la altura del pecho superior. No eleves los hombros."],
          ["Leverage_Shoulder_Press", 3, 8, 12, ""],
          ["Butterfly", 3, 10, 15, ""],
          ["Side_Lateral_Raise", 3, 12, 20, ""],
          ["Triceps_Pushdown", 2, 12, 15, ""],
          ["Parallel_Bar_Dip", 3, 8, 12, ""],
          ["Hanging_Leg_Raise", 3, 10, 15, ""],
        ],
      },
      {
        name: "Día 4 — Espalda y pierna B",
        focus: "4 ejercicios compartidos · extra de muñeca para Daniel",
        exercises: [
          ["Seated_Cable_Rows", 3, 8, 12, ""],
          ["Close-Grip_Front_Lat_Pulldown", 3, 10, 12, "Agarre distinto al día principal."],
          ["Single-Leg_Leg_Press", 3, 10, 12, "Por pierna. Empieza con bastante menos peso que en la prensa normal y no levantes la cadera del respaldo."],
          ["Seated_Leg_Curl", 3, 10, 15, "Segundo estímulo semanal de isquios en máquina."],
          ["Palms-Up_Barbell_Wrist_Curl_Over_A_Bench", 2, 12, 20, "Flexores de muñeca."],
          ["Palms-Down_Wrist_Curl_Over_A_Bench", 2, 12, 20, "Extensores de muñeca. Usa poco peso."],
        ],
      },
      CARDIO_DAY,
    ],
  },
  {
    username: OWNER_ELLA,
    name: "Entreno · Ella",
    description: "Fuerza completa compatible con pole. Cuatro días coordinados con Daniel, manteniendo prioridad de glúteo y core.",
    movilidadName: "Movilidad de cadera y espalda",
    days: [
      {
        name: "Día 1 — Tirón y bíceps",
        focus: "5 ejercicios compartidos · extra de core para Elena",
        exercises: [
          ["Wide-Grip_Lat_Pulldown", 3, 8, 12, "Agarre cómodo; no hace falta hacer dominadas."],
          ["Leverage_Iso_Row", 3, 10, 12, "Misma máquina que Daniel; ajustad asiento y carga para cada uno."],
          ["Reverse_Machine_Flyes", 3, 12, 20, "Peck deck al revés: misma máquina, ejecución para deltoide posterior."],
          ["Barbell_Curl", 3, 10, 12, ""],
          ["Hammer_Curls", 2, 10, 12, ""],
          ["Side_Bridge", 3, null, null, "30-45 s por lado."],
        ],
      },
      {
        name: "Día 2 — Pierna A",
        focus: "5 ejercicios compartidos · extra de glúteo para Elena",
        exercises: [
          ["Leg_Press", 3, 10, 12, ""],
          ["Barbell_Hip_Thrust", 3, 10, 12, "Pausa un segundo arriba."],
          ["Lying_Leg_Curls", 3, 10, 12, ""],
          ["Leg_Extensions", 3, 12, 15, ""],
          ["Standing_Calf_Raises", 3, 15, 20, ""],
          ["Thigh_Abductor", 3, 15, 20, ""],
        ],
      },
      {
        name: "Día 3 — Empuje",
        focus: "5 ejercicios compartidos · extra de core y movilidad para Elena",
        exercises: [
          ["Leverage_Incline_Chest_Press", 3, 8, 12, "Ajusta el asiento para que las asas queden a la altura del pecho superior. No eleves los hombros."],
          ["Leverage_Shoulder_Press", 3, 10, 12, ""],
          ["Butterfly", 3, 12, 15, ""],
          ["Side_Lateral_Raise", 3, 12, 15, ""],
          ["Triceps_Pushdown", 3, 12, 15, ""],
          ["Ab_Roller", 3, null, null, "3 series. Core fuerte."],
          [null, null, null, null, "5-10 min de movilidad de cadera y espalda."],
        ],
      },
      {
        name: "Día 4 — Espalda y pierna B",
        focus: "4 ejercicios compartidos · extra de glúteo y core para Elena",
        exercises: [
          ["Seated_Cable_Rows", 3, 10, 12, ""],
          ["Close-Grip_Front_Lat_Pulldown", 3, 10, 12, ""],
          ["Single-Leg_Leg_Press", 3, 10, 12, "Por pierna. Sustituye la búlgara en Smith."],
          ["Seated_Leg_Curl", 3, 10, 15, ""],
          ["Glute_Kickback", 3, 12, 15, ""],
          ["Hanging_Leg_Raise", 3, 12, 15, ""],
        ],
      },
      CARDIO_DAY,
    ],
  },
];

await ensureSingleLegPress();

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

  const { data: existingRoutines, error: existingRoutineErr } = await supabase
    .from("routines")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("name", routine.name)
    .order("created_at", { ascending: true })
    .limit(2);
  if (existingRoutineErr) {
    console.error("  Error buscando la rutina:", existingRoutineErr.message);
    continue;
  }

  if ((existingRoutines ?? []).length > 1) {
    console.warn("  Hay rutinas duplicadas; se sincroniza la más antigua sin borrar las demás.");
  }

  const routineId = existingRoutines?.[0]?.id ?? randomUUID();
  const routineValues = {
    name: routine.name,
    description: routine.description,
    is_active: true,
  };
  const { error: rErr } = existingRoutines?.[0]
    ? await supabase.from("routines").update(routineValues).eq("id", routineId)
    : await supabase.from("routines").insert({
        id: routineId,
        owner_id: ownerId,
        ...routineValues,
      });
  if (rErr) {
    console.error("  Error sincronizando rutina:", rErr.message);
    continue;
  }

  const { data: existingDays, error: daysErr } = await supabase
    .from("routine_days")
    .select("id, position")
    .eq("routine_id", routineId)
    .order("position");
  if (daysErr) {
    console.error("  Error buscando días:", daysErr.message);
    continue;
  }

  const daysByPosition = new Map((existingDays ?? []).map((d) => [d.position, d]));
  let exerciseCount = 0;
  let syncFailed = false;

  for (const [di, day] of routine.days.entries()) {
    const existingDay = daysByPosition.get(di);
    const dayId = existingDay?.id ?? randomUUID();
    const dayValues = {
      routine_id: routineId,
      position: di,
      name: day.name,
      focus: day.focus,
    };
    const { error: dayErr } = existingDay
      ? await supabase.from("routine_days").update(dayValues).eq("id", dayId)
      : await supabase.from("routine_days").insert({ id: dayId, ...dayValues });
    if (dayErr) {
      console.error(`  Error sincronizando día ${di + 1}:`, dayErr.message);
      syncFailed = true;
      break;
    }

    const { data: existingExercises, error: existingExercisesErr } =
      await supabase
        .from("routine_exercises")
        .select("id, position")
        .eq("day_id", dayId)
        .order("position");
    if (existingExercisesErr) {
      console.error(
        `  Error buscando ejercicios del día ${di + 1}:`,
        existingExercisesErr.message,
      );
      syncFailed = true;
      break;
    }
    const exercisesByPosition = new Map(
      (existingExercises ?? []).map((e) => [e.position, e]),
    );

    for (const [ei, exercise] of day.exercises.entries()) {
      const existingExercise = exercisesByPosition.get(ei);
      const exerciseId =
        exercise[0] === null ? movilidadId : slugToId.get(exercise[0]);
      const exerciseValues = {
        day_id: dayId,
        exercise_id: exerciseId,
        position: ei,
        target_sets: exercise[1],
        target_reps_min: exercise[2],
        target_reps_max: exercise[3],
        notes: exercise[4] || null,
      };
      const { error: exerciseErr } = existingExercise
        ? await supabase
            .from("routine_exercises")
            .update(exerciseValues)
            .eq("id", existingExercise.id)
        : await supabase.from("routine_exercises").insert({
            id: randomUUID(),
            ...exerciseValues,
          });
      if (exerciseErr) {
        console.error(
          `  Error sincronizando ejercicio ${ei + 1} del día ${di + 1}:`,
          exerciseErr.message,
        );
        syncFailed = true;
        break;
      }
      exerciseCount += 1;
    }
    if (syncFailed) break;

    const extraExerciseIds = (existingExercises ?? [])
      .filter((e) => e.position >= day.exercises.length)
      .map((e) => e.id);
    if (extraExerciseIds.length) {
      const { error: deleteExercisesErr } = await supabase
        .from("routine_exercises")
        .delete()
        .in("id", extraExerciseIds);
      if (deleteExercisesErr) {
        console.error(
          `  Error retirando ejercicios sobrantes del día ${di + 1}:`,
          deleteExercisesErr.message,
        );
        syncFailed = true;
        break;
      }
    }
  }
  if (syncFailed) continue;

  const extraDays = (existingDays ?? []).filter(
    (day) => day.position >= routine.days.length,
  );
  for (const day of extraDays) {
    const { count, error: countErr } = await supabase
      .from("workout_sessions")
      .select("id", { count: "exact", head: true })
      .eq("routine_day_id", day.id);
    if (countErr || count) {
      console.warn(
        `  No se borra el día sobrante ${day.position + 1}: tiene historial o no se pudo comprobar.`,
      );
      continue;
    }
    const { error: deleteDayErr } = await supabase
      .from("routine_days")
      .delete()
      .eq("id", day.id);
    if (deleteDayErr) {
      console.warn(`  No se pudo borrar el día sobrante ${day.position + 1}.`);
    }
  }

  console.log(`  ✓ ${routine.days.length} días, ${exerciseCount} ejercicios.`);
}

console.log("\n==> Seed de rutinas completado.");
