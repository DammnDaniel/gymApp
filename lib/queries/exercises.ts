import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export type ExerciseListItem = {
  id: string;
  slug: string;
  name: string;
  name_es: string | null;
  equipment: string | null;
  level: string | null;
  primary_muscles: string[];
  image_start: string | null;
  image_end: string | null;
};

export type ExerciseFilters = {
  q?: string;
  muscle?: string;
  equipment?: string;
};

export function useExercises(filters: ExerciseFilters) {
  return useQuery({
    queryKey: ["exercises", filters],
    queryFn: async (): Promise<ExerciseListItem[]> => {
      const supabase = createClient();
      let query = supabase
        .from("exercises")
        .select(
          "id, slug, name, name_es, equipment, level, primary_muscles, image_start, image_end",
        )
        .order("name")
        .limit(150);

      if (filters.q)
        query = query.or(
          `name.ilike.%${filters.q}%,name_es.ilike.%${filters.q}%`,
        );
      if (filters.muscle)
        query = query.contains("primary_muscles", [filters.muscle]);
      if (filters.equipment) query = query.eq("equipment", filters.equipment);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}
