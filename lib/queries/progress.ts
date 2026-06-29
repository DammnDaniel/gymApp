import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export type ExerciseWithLogs = { exercise_id: string; name: string };

export type ProgressPoint = {
  day: string;
  e1rm: number;
  volume: number;
  bestWeight: number;
};

export type ProgressSummary = {
  points: ProgressPoint[];
  prE1rm: number;
  bestWeight: number;
  sessions: number;
  totalVolume: number;
};

const epley = (w: number, reps: number) => w * (1 + reps / 30);

/** Ejercicios que el usuario tiene registrados (para el selector). */
export function useExercisesWithLogs() {
  return useQuery({
    queryKey: ["progress", "exercises"],
    queryFn: async (): Promise<ExerciseWithLogs[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("set_logs")
        .select("exercise_id, exercise:exercises(name, name_es)")
        .not("weight_kg", "is", null)
        .limit(5000);
      if (error) throw error;
      const map = new Map<string, string>();
      for (const r of (data ?? []) as any[]) {
        if (!map.has(r.exercise_id))
          map.set(
            r.exercise_id,
            r.exercise?.name_es ?? r.exercise?.name ?? "Ejercicio",
          );
      }
      return [...map.entries()]
        .map(([exercise_id, name]) => ({ exercise_id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  });
}

/** Serie temporal + métricas de un ejercicio en un rango de días (0 = todo). */
export function useExerciseProgress(exerciseId: string, days: number) {
  return useQuery({
    queryKey: ["progress", "exercise", exerciseId, days],
    enabled: !!exerciseId,
    queryFn: async (): Promise<ProgressSummary> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("set_logs")
        .select(
          "weight_kg, reps, session:workout_sessions!inner(performed_at)",
        )
        .eq("exercise_id", exerciseId)
        .eq("is_warmup", false)
        .not("weight_kg", "is", null)
        .not("reps", "is", null);
      if (error) throw error;

      const cutoff =
        days > 0 ? Date.now() - days * 24 * 60 * 60 * 1000 : -Infinity;

      const byDay = new Map<
        string,
        { e1rm: number; volume: number; bestWeight: number }
      >();
      let prE1rm = 0;
      let bestWeight = 0;
      let totalVolume = 0;

      for (const r of (data ?? []) as any[]) {
        const performed = r.session?.performed_at;
        if (!performed) continue;
        if (new Date(performed).getTime() < cutoff) continue;
        const day = String(performed).slice(0, 10);
        const e1 = epley(r.weight_kg, r.reps);
        const vol = r.weight_kg * r.reps;
        const cur = byDay.get(day) ?? { e1rm: 0, volume: 0, bestWeight: 0 };
        cur.e1rm = Math.max(cur.e1rm, e1);
        cur.volume += vol;
        cur.bestWeight = Math.max(cur.bestWeight, r.weight_kg);
        byDay.set(day, cur);
        prE1rm = Math.max(prE1rm, e1);
        bestWeight = Math.max(bestWeight, r.weight_kg);
        totalVolume += vol;
      }

      const points = [...byDay.entries()]
        .map(([day, v]) => ({
          day,
          e1rm: Math.round(v.e1rm * 10) / 10,
          volume: Math.round(v.volume),
          bestWeight: v.bestWeight,
        }))
        .sort((a, b) => a.day.localeCompare(b.day));

      return {
        points,
        prE1rm: Math.round(prE1rm * 10) / 10,
        bestWeight,
        sessions: byDay.size,
        totalVolume: Math.round(totalVolume),
      };
    },
  });
}
