import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CoachMemory,
  CoachOperation,
  CoachProposal,
} from "@/lib/coach/types";

type Db = SupabaseClient<any, "public", any>;

const exerciseSelect =
  "id, slug, name, name_es, equipment, primary_muscles, secondary_muscles, category, tips";

function displayExerciseName(exercise: any) {
  return exercise?.name_es || exercise?.name || "Ejercicio";
}

export async function getRoutineSummaries(
  supabase: Db,
  userId: string,
) {
  const { data, error } = await supabase
    .from("routines")
    .select(
      "id, owner_id, name, description, is_active, routine_days(id, name, focus, position)",
    )
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((routine: any) => ({
    id: routine.id,
    owner_id: routine.owner_id,
    name: routine.name,
    description: routine.description,
    is_active: routine.is_active,
    is_own: routine.owner_id === userId,
    days: [...(routine.routine_days ?? [])]
      .sort((a: any, b: any) => a.position - b.position)
      .map((day: any) => ({
        id: day.id,
        name: day.name,
        focus: day.focus,
      })),
  }));
}

export async function getRoutineDetails(supabase: Db, routineId: string) {
  const { data, error } = await supabase
    .from("routines")
    .select(
      `id, owner_id, name, description, is_active,
       routine_days(
         id, name, focus, position,
         routine_exercises(
           id, position, target_sets, target_reps_min, target_reps_max, notes,
           exercise:exercises(${exerciseSelect})
         )
       )`,
    )
    .eq("id", routineId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const routine: any = data;
  routine.routine_days = [...(routine.routine_days ?? [])]
    .sort((a: any, b: any) => a.position - b.position)
    .map((day: any) => ({
      ...day,
      routine_exercises: [...(day.routine_exercises ?? [])].sort(
        (a: any, b: any) => a.position - b.position,
      ),
    }));
  return routine;
}

function cleanSearch(value: string | null | undefined) {
  return (value ?? "").trim().replace(/[%_]/g, "").slice(0, 80);
}

export async function searchExercises(
  supabase: Db,
  input: {
    query: string | null;
    muscle: string | null;
    equipment: string | null;
    limit: number;
  },
) {
  const query = cleanSearch(input.query);
  const muscle = cleanSearch(input.muscle);
  const equipment = cleanSearch(input.equipment);
  const limit = Math.max(1, Math.min(input.limit || 8, 12));
  const found = new Map<string, any>();

  const run = async (column?: "name_es" | "name" | "slug") => {
    let request = supabase.from("exercises").select(exerciseSelect);
    if (column && query) request = request.ilike(column, `%${query}%`);
    if (equipment) request = request.ilike("equipment", `%${equipment}%`);
    if (muscle) request = request.contains("primary_muscles", [muscle]);
    const { data, error } = await request.limit(limit);
    if (error) throw error;
    for (const exercise of data ?? []) found.set(exercise.id, exercise);
  };

  if (query) {
    await Promise.all([run("name_es"), run("name"), run("slug")]);
  } else {
    await run();
  }

  return [...found.values()].slice(0, limit).map((exercise: any) => ({
    id: exercise.id,
    name: displayExerciseName(exercise),
    slug: exercise.slug,
    equipment: exercise.equipment,
    primary_muscles: exercise.primary_muscles,
    secondary_muscles: exercise.secondary_muscles,
    category: exercise.category,
    tips: exercise.tips,
  }));
}

export async function getTrainingHistory(
  supabase: Db,
  userId: string,
  input: { exercise_id: string | null; limit: number },
) {
  const limit = Math.max(1, Math.min(input.limit || 8, 20));
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(
      `id, performed_at, duration_seconds, notes,
       set_logs(id, exercise_id, set_number, weight_kg, reps, rpe, duration_seconds,
         exercise:exercises(id, name, name_es))`,
    )
    .eq("owner_id", userId)
    .order("performed_at", { ascending: false })
    .limit(input.exercise_id ? 30 : limit);
  if (error) throw error;

  return (data ?? [])
    .map((session: any) => ({
      ...session,
      set_logs: (session.set_logs ?? []).filter(
        (set: any) => !input.exercise_id || set.exercise_id === input.exercise_id,
      ),
    }))
    .filter((session: any) => !input.exercise_id || session.set_logs.length > 0)
    .slice(0, limit);
}

export async function getCoachMemories(supabase: Db, userId: string) {
  const { data, error } = await supabase
    .from("coach_memories")
    .select("id, category, content, created_at")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []) as CoachMemory[];
}

export async function rememberTrainingContext(
  supabase: Db,
  userId: string,
  input: { category: CoachMemory["category"]; content: string },
) {
  const content = input.content.trim().replace(/\s+/g, " ").slice(0, 300);
  if (content.length < 2) throw new Error("Contexto vacío");
  const { data, error } = await supabase
    .from("coach_memories")
    .upsert(
      {
        owner_id: userId,
        category: input.category,
        content,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_id,category,content" },
    )
    .select("id, category, content, created_at")
    .single();
  if (error) throw error;
  return data;
}

function integerOrNull(value: unknown, min: number, max: number) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

export async function createRoutineProposal(
  supabase: Db,
  input: {
    userId: string;
    threadId: string;
    model: string;
    routine_id: string;
    title: string;
    summary: string;
    operations: CoachOperation[];
  },
): Promise<CoachProposal> {
  const routine = await getRoutineDetails(supabase, input.routine_id);
  if (!routine) throw new Error("Rutina no encontrada");
  if (routine.owner_id !== input.userId) {
    throw new Error("La rutina es compartida y solo se puede consultar");
  }
  if (!Array.isArray(input.operations) || input.operations.length < 1) {
    throw new Error("La propuesta no contiene cambios");
  }
  if (input.operations.length > 12) {
    throw new Error("Demasiados cambios en una sola propuesta");
  }

  const days = new Map<string, any>();
  const routineExercises = new Map<string, any>();
  for (const day of routine.routine_days ?? []) {
    days.set(day.id, day);
    for (const item of day.routine_exercises ?? []) {
      routineExercises.set(item.id, { ...item, day });
    }
  }

  const newExerciseIds = [
    ...new Set(
      input.operations
        .map((operation) => operation.exercise_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const exerciseMap = new Map<string, any>();
  if (newExerciseIds.length) {
    const { data, error } = await supabase
      .from("exercises")
      .select(exerciseSelect)
      .in("id", newExerciseIds);
    if (error) throw error;
    for (const exercise of data ?? []) exerciseMap.set(exercise.id, exercise);
  }

  const operations = input.operations.map((operation) => {
    const current = operation.routine_exercise_id
      ? routineExercises.get(operation.routine_exercise_id)
      : null;
    const day = operation.day_id ? days.get(operation.day_id) : current?.day;
    const exercise = operation.exercise_id
      ? exerciseMap.get(operation.exercise_id)
      : null;

    if (
      [
        "replace_exercise",
        "remove_exercise",
        "update_prescription",
        "move_exercise",
      ].includes(operation.type) &&
      !current
    ) {
      throw new Error("La propuesta referencia un ejercicio que no pertenece a la rutina");
    }
    if (["add_exercise", "move_exercise"].includes(operation.type) && !day) {
      throw new Error("La propuesta referencia un día que no pertenece a la rutina");
    }
    if (["add_exercise", "replace_exercise"].includes(operation.type) && !exercise) {
      throw new Error("El ejercicio nuevo no existe en la biblioteca");
    }

    return {
      type: operation.type,
      routine_exercise_id: current?.id ?? null,
      day_id: day?.id ?? null,
      exercise_id: exercise?.id ?? null,
      position: integerOrNull(operation.position, 0, 100),
      target_sets: integerOrNull(operation.target_sets, 1, 20),
      target_reps_min: integerOrNull(operation.target_reps_min, 1, 999),
      target_reps_max: integerOrNull(operation.target_reps_max, 1, 999),
      notes: operation.notes?.trim().slice(0, 600) || null,
      reason: operation.reason?.trim().slice(0, 500) || "Ajuste propuesto por el Coach",
      current_exercise_name: current
        ? displayExerciseName(current.exercise)
        : undefined,
      exercise_name: exercise ? displayExerciseName(exercise) : undefined,
      day_name: day?.name,
    } satisfies CoachOperation;
  });

  const { data, error } = await supabase
    .from("routine_change_proposals")
    .insert({
      owner_id: input.userId,
      thread_id: input.threadId,
      routine_id: input.routine_id,
      title: input.title?.trim().slice(0, 160) || "Propuesta de ajuste",
      summary:
        input.summary?.trim().slice(0, 4000) ||
        "Revisa los cambios individualmente antes de aplicarlos.",
      operations,
      model: input.model,
    })
    .select(
      "id, thread_id, routine_id, status, title, summary, operations, model, created_at, applied_at, undone_at",
    )
    .single();
  if (error) throw error;
  return data as CoachProposal;
}
