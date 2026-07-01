import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export type LastSet = {
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
  duration_seconds: number | null;
};

export type WorkoutExercise = {
  rowId: string;
  exerciseId: string;
  slug: string;
  name: string;
  name_es: string | null;
  image_start: string | null;
  category: string | null;
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
             exercise:exercises ( slug, name, name_es, image_start, category )
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
          .select(
            "exercise_id, session_id, set_number, weight_kg, reps, rpe, duration_seconds, created_at",
          )
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
          arr.push({
            weight_kg: l.weight_kg,
            reps: l.reps,
            rpe: l.rpe,
            duration_seconds: l.duration_seconds,
          });
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
        category: r.exercise?.category ?? null,
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
  duration_seconds: number | null;
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
          duration_seconds: s.duration_seconds,
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

// ─── Historial de sesiones (ver / editar / borrar) ──────────────────
export type SessionListItem = {
  id: string;
  performed_at: string;
  duration_seconds: number | null;
  dayName: string | null;
  routineName: string | null;
  setCount: number;
};

export type SessionSetRow = {
  id: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
  duration_seconds: number | null;
};

export type SessionExercise = {
  exerciseId: string;
  name: string;
  category: string | null;
  sets: SessionSetRow[];
};

export type SessionDetail = {
  id: string;
  performed_at: string;
  duration_seconds: number | null;
  dayName: string | null;
  routineName: string | null;
  exercises: SessionExercise[];
};

export const sessionKeys = {
  all: ["sessions"] as const,
  list: () => ["sessions", "list"] as const,
  detail: (id: string) => ["sessions", "detail", id] as const,
};

export function useSessions() {
  return useQuery({
    queryKey: sessionKeys.list(),
    queryFn: async (): Promise<SessionListItem[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("workout_sessions")
        .select(
          "id, performed_at, duration_seconds, routine_day:routine_days(name, routine:routines(name)), set_logs(count)",
        )
        .order("performed_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((s: any) => ({
        id: s.id,
        performed_at: s.performed_at,
        duration_seconds: s.duration_seconds,
        dayName: s.routine_day?.name ?? null,
        routineName: s.routine_day?.routine?.name ?? null,
        setCount: s.set_logs?.[0]?.count ?? 0,
      }));
    },
  });
}

export function useSessionDetail(id: string) {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    enabled: !!id,
    queryFn: async (): Promise<SessionDetail | null> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("workout_sessions")
        .select(
          "id, performed_at, duration_seconds, routine_day:routine_days(name, routine:routines(name)), set_logs(id, exercise_id, set_number, weight_kg, reps, rpe, duration_seconds, exercise:exercises(name, name_es, category))",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const raw = data as any;
      const byEx = new Map<string, SessionExercise>();
      const order: string[] = [];
      for (const l of (raw.set_logs ?? []) as any[]) {
        if (!byEx.has(l.exercise_id)) {
          byEx.set(l.exercise_id, {
            exerciseId: l.exercise_id,
            name: l.exercise?.name_es ?? l.exercise?.name ?? "Ejercicio",
            category: l.exercise?.category ?? null,
            sets: [],
          });
          order.push(l.exercise_id);
        }
        byEx.get(l.exercise_id)!.sets.push({
          id: l.id,
          set_number: l.set_number,
          weight_kg: l.weight_kg,
          reps: l.reps,
          rpe: l.rpe,
          duration_seconds: l.duration_seconds,
        });
      }
      for (const ex of byEx.values())
        ex.sets.sort((a, b) => a.set_number - b.set_number);
      return {
        id: raw.id,
        performed_at: raw.performed_at,
        duration_seconds: raw.duration_seconds,
        dayName: raw.routine_day?.name ?? null,
        routineName: raw.routine_day?.routine?.name ?? null,
        exercises: order.map((eid) => byEx.get(eid)!),
      };
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("workout_sessions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries(),
  });
}

export function useUpdateSetLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      sessionId: string;
      setId: string;
      patch: Partial<
        Pick<SessionSetRow, "weight_kg" | "reps" | "rpe" | "duration_seconds">
      >;
    }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("set_logs")
        .update(input.patch)
        .eq("id", input.setId);
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries(),
  });
}

export function useDeleteSetLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { sessionId: string; setId: string }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("set_logs")
        .delete()
        .eq("id", input.setId);
      if (error) throw error;
    },
    onSettled: (_d, _e, input) =>
      qc.invalidateQueries({ queryKey: sessionKeys.detail(input.sessionId) }),
  });
}
