import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export type LastSet = {
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
};

export type WorkoutExercise = {
  rowId: string;
  exerciseId: string;
  slug: string;
  name: string;
  name_es: string | null;
  image_start: string | null;
  target_sets: number | null;
  target_reps_min: number | null;
  target_reps_max: number | null;
  notes: string | null;
  lastSets: LastSet[];
};

export type WorkoutDay = {
  id: string;
  name: string;
  routineName: string;
  exercises: WorkoutExercise[];
};

export const workoutKeys = {
  all: ["workouts"] as const,
  day: (dayId: string) => [...workoutKeys.all, "day", dayId] as const,
};

export function useWorkoutDay(dayId: string) {
  return useQuery({
    queryKey: workoutKeys.day(dayId),
    enabled: !!dayId,
    queryFn: async (): Promise<WorkoutDay | null> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("routine_days")
        .select(
          `id, name,
           routine:routines(name),
           routine_exercises (
             id, exercise_id, position, target_sets, target_reps_min, target_reps_max, notes,
             exercise:exercises ( slug, name, name_es, image_start )
           )`,
        )
        .eq("id", dayId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const raw = data as any;

      const res = [...(raw.routine_exercises ?? [])].sort(
        (a: any, b: any) => a.position - b.position,
      );
      const exerciseIds: string[] = res.map((r: any) => r.exercise_id);

      // autorrelleno: últimas series registradas por ejercicio (RLS = propias)
      const lastByExercise = new Map<string, LastSet[]>();
      if (exerciseIds.length) {
        const { data: logs } = await supabase
          .from("set_logs")
          .select("exercise_id, session_id, set_number, weight_kg, reps, rpe, created_at")
          .in("exercise_id", exerciseIds)
          .eq("is_warmup", false)
          .order("created_at", { ascending: false })
          .limit(800);
        const latestSession = new Map<string, string>();
        for (const l of (logs ?? []) as any[]) {
          if (!latestSession.has(l.exercise_id))
            latestSession.set(l.exercise_id, l.session_id);
        }
        for (const l of (logs ?? []) as any[]) {
          if (latestSession.get(l.exercise_id) !== l.session_id) continue;
          const arr = lastByExercise.get(l.exercise_id) ?? [];
          arr.push({ weight_kg: l.weight_kg, reps: l.reps, rpe: l.rpe });
          lastByExercise.set(l.exercise_id, arr);
        }
      }

      const exercises: WorkoutExercise[] = res.map((r: any) => ({
        rowId: r.id,
        exerciseId: r.exercise_id,
        slug: r.exercise?.slug ?? "",
        name: r.exercise?.name ?? "Ejercicio",
        name_es: r.exercise?.name_es ?? null,
        image_start: r.exercise?.image_start ?? null,
        target_sets: r.target_sets,
        target_reps_min: r.target_reps_min,
        target_reps_max: r.target_reps_max,
        notes: r.notes,
        lastSets: lastByExercise.get(r.exercise_id) ?? [],
      }));

      return {
        id: raw.id,
        name: raw.name,
        routineName: raw.routine?.name ?? "",
        exercises,
      };
    },
  });
}

export type SaveSetInput = {
  exerciseId: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
  is_warmup: boolean;
};

export function useSaveWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      dayId: string;
      durationSeconds: number | null;
      sets: SaveSetInput[];
    }) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesión expirada");

      const sessionId = crypto.randomUUID();
      const { error: sErr } = await supabase.from("workout_sessions").insert({
        id: sessionId,
        owner_id: user.id,
        routine_day_id: input.dayId,
        duration_seconds: input.durationSeconds,
      });
      if (sErr) throw sErr;

      if (input.sets.length) {
        const rows = input.sets.map((s) => ({
          id: crypto.randomUUID(),
          session_id: sessionId,
          exercise_id: s.exerciseId,
          set_number: s.set_number,
          weight_kg: s.weight_kg,
          reps: s.reps,
          rpe: s.rpe,
          is_warmup: s.is_warmup,
        }));
        const { error: lErr } = await supabase.from("set_logs").insert(rows);
        if (lErr) throw lErr;
      }
      return { sessionId, count: input.sets.length };
    },
    onSettled: () => qc.invalidateQueries({ queryKey: workoutKeys.all }),
  });
}
