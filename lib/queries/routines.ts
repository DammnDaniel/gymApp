import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// ─── Tipos ──────────────────────────────────────────────────────────
export type RoutineListItem = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  day_count: number;
};

export type RoutineExerciseCatalog = {
  id: string;
  slug: string;
  name: string;
  name_es: string | null;
  image_start: string | null;
  primary_muscles: string[];
};

export type RoutineExercise = {
  id: string;
  day_id: string;
  exercise_id: string;
  position: number;
  target_sets: number | null;
  target_reps_min: number | null;
  target_reps_max: number | null;
  notes: string | null;
  exercise: RoutineExerciseCatalog | null;
};

export type RoutineDay = {
  id: string;
  routine_id: string;
  position: number;
  name: string;
  focus: string | null;
  routine_exercises: RoutineExercise[];
};

export type RoutineDetail = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  routine_days: RoutineDay[];
};

// ─── Query keys ─────────────────────────────────────────────────────
export const routineKeys = {
  all: ["routines"] as const,
  lists: () => [...routineKeys.all, "list"] as const,
  detail: (id: string) => [...routineKeys.all, "detail", id] as const,
};

// ─── Lecturas ───────────────────────────────────────────────────────
export function useRoutines() {
  return useQuery({
    queryKey: routineKeys.lists(),
    queryFn: async (): Promise<RoutineListItem[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("routines")
        .select("id, name, description, is_active, created_at, routine_days(count)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        is_active: r.is_active,
        created_at: r.created_at,
        day_count: r.routine_days?.[0]?.count ?? 0,
      }));
    },
  });
}

export function useRoutine(id: string) {
  return useQuery({
    queryKey: routineKeys.detail(id),
    enabled: !!id,
    queryFn: async (): Promise<RoutineDetail | null> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("routines")
        .select(
          `id, owner_id, name, description, is_active,
           routine_days (
             id, routine_id, position, name, focus,
             routine_exercises (
               id, day_id, exercise_id, position,
               target_sets, target_reps_min, target_reps_max, notes,
               exercise:exercises ( id, slug, name, name_es, image_start, primary_muscles )
             )
           )`,
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      // PostgREST no garantiza orden en embeds: normalizar por position.
      // (supabase-js tipa el embed to-one como array; en runtime es objeto.)
      const raw = data as any;
      const days: RoutineDay[] = [...(raw.routine_days ?? [])].sort(
        (a: RoutineDay, b: RoutineDay) => a.position - b.position,
      );
      for (const d of days) {
        d.routine_exercises = [...(d.routine_exercises ?? [])].sort(
          (a: RoutineExercise, b: RoutineExercise) => a.position - b.position,
        );
      }
      return { ...raw, routine_days: days } as RoutineDetail;
    },
  });
}

// ─── Helpers de cache (optimistic) ──────────────────────────────────
function patchDetail(
  qc: QueryClient,
  routineId: string,
  fn: (d: RoutineDetail) => RoutineDetail,
) {
  qc.setQueryData<RoutineDetail | null>(routineKeys.detail(routineId), (prev) =>
    prev ? fn(prev) : prev,
  );
}

function mapDay(
  d: RoutineDetail,
  dayId: string,
  fn: (day: RoutineDay) => RoutineDay,
): RoutineDetail {
  return {
    ...d,
    routine_days: d.routine_days.map((day) => (day.id === dayId ? fn(day) : day)),
  };
}

// ─── Mutaciones: rutina ─────────────────────────────────────────────
export function useCreateRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesión expirada");
      const id = crypto.randomUUID();
      const { data, error } = await supabase
        .from("routines")
        .insert({
          id,
          owner_id: user.id,
          name: input.name,
          description: input.description ?? null,
        })
        .select("id, name, description, is_active, created_at")
        .single();
      if (error) throw error;
      return data;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: routineKeys.lists() }),
  });
}

export function useRenameRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name: string;
      description?: string | null;
    }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("routines")
        .update({ name: input.name, description: input.description })
        .eq("id", input.id);
      if (error) throw error;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: routineKeys.detail(input.id) });
      const prev = qc.getQueryData<RoutineDetail | null>(
        routineKeys.detail(input.id),
      );
      patchDetail(qc, input.id, (d) => ({
        ...d,
        name: input.name,
        description: input.description ?? d.description,
      }));
      return { prev };
    },
    onError: (_e, input, ctx) =>
      qc.setQueryData(routineKeys.detail(input.id), ctx?.prev),
    onSettled: (_d, _e, input) => {
      qc.invalidateQueries({ queryKey: routineKeys.detail(input.id) });
      qc.invalidateQueries({ queryKey: routineKeys.lists() });
    },
  });
}

export function useDeleteRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("routines").delete().eq("id", id);
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: routineKeys.lists() }),
  });
}

// ─── Mutaciones: días ───────────────────────────────────────────────
export function useCreateDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      routineId: string;
      name: string;
      focus?: string | null;
      position: number;
    }) => {
      const supabase = createClient();
      const id = crypto.randomUUID();
      const { error } = await supabase.from("routine_days").insert({
        id,
        routine_id: input.routineId,
        name: input.name,
        focus: input.focus ?? null,
        position: input.position,
      });
      if (error) throw error;
      return { id };
    },
    onSettled: (_d, _e, input) =>
      qc.invalidateQueries({ queryKey: routineKeys.detail(input.routineId) }),
  });
}

export function useUpdateDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      routineId: string;
      dayId: string;
      name?: string;
      focus?: string | null;
    }) => {
      const supabase = createClient();
      const patch: Record<string, unknown> = {};
      if (input.name !== undefined) patch.name = input.name;
      if (input.focus !== undefined) patch.focus = input.focus;
      const { error } = await supabase
        .from("routine_days")
        .update(patch)
        .eq("id", input.dayId);
      if (error) throw error;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: routineKeys.detail(input.routineId) });
      const prev = qc.getQueryData<RoutineDetail | null>(
        routineKeys.detail(input.routineId),
      );
      patchDetail(qc, input.routineId, (d) =>
        mapDay(d, input.dayId, (day) => ({
          ...day,
          name: input.name ?? day.name,
          focus: input.focus !== undefined ? input.focus : day.focus,
        })),
      );
      return { prev };
    },
    onError: (_e, input, ctx) =>
      qc.setQueryData(routineKeys.detail(input.routineId), ctx?.prev),
    onSettled: (_d, _e, input) =>
      qc.invalidateQueries({ queryKey: routineKeys.detail(input.routineId) }),
  });
}

export function useDeleteDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { routineId: string; dayId: string }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("routine_days")
        .delete()
        .eq("id", input.dayId);
      if (error) throw error;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: routineKeys.detail(input.routineId) });
      const prev = qc.getQueryData<RoutineDetail | null>(
        routineKeys.detail(input.routineId),
      );
      patchDetail(qc, input.routineId, (d) => ({
        ...d,
        routine_days: d.routine_days.filter((day) => day.id !== input.dayId),
      }));
      return { prev };
    },
    onError: (_e, input, ctx) =>
      qc.setQueryData(routineKeys.detail(input.routineId), ctx?.prev),
    onSettled: (_d, _e, input) =>
      qc.invalidateQueries({ queryKey: routineKeys.detail(input.routineId) }),
  });
}

export function useReorderDays() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { routineId: string; orderedDayIds: string[] }) => {
      const supabase = createClient();
      await Promise.all(
        input.orderedDayIds.map((id, i) =>
          supabase.from("routine_days").update({ position: i }).eq("id", id),
        ),
      );
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: routineKeys.detail(input.routineId) });
      const prev = qc.getQueryData<RoutineDetail | null>(
        routineKeys.detail(input.routineId),
      );
      patchDetail(qc, input.routineId, (d) => {
        const byId = new Map(d.routine_days.map((day) => [day.id, day]));
        const days = input.orderedDayIds
          .map((id, i) => {
            const day = byId.get(id);
            return day ? { ...day, position: i } : null;
          })
          .filter(Boolean) as RoutineDay[];
        return { ...d, routine_days: days };
      });
      return { prev };
    },
    onError: (_e, input, ctx) =>
      qc.setQueryData(routineKeys.detail(input.routineId), ctx?.prev),
    onSettled: (_d, _e, input) =>
      qc.invalidateQueries({ queryKey: routineKeys.detail(input.routineId) }),
  });
}

// ─── Mutaciones: ejercicios del día ─────────────────────────────────
export function useAddExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      routineId: string;
      dayId: string;
      exerciseId: string;
      position: number;
    }) => {
      const supabase = createClient();
      const id = crypto.randomUUID();
      const { error } = await supabase.from("routine_exercises").insert({
        id,
        day_id: input.dayId,
        exercise_id: input.exerciseId,
        position: input.position,
      });
      if (error) throw error;
      return { id };
    },
    onSettled: (_d, _e, input) =>
      qc.invalidateQueries({ queryKey: routineKeys.detail(input.routineId) }),
  });
}

export function useRemoveExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      routineId: string;
      dayId: string;
      rowId: string;
    }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("routine_exercises")
        .delete()
        .eq("id", input.rowId);
      if (error) throw error;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: routineKeys.detail(input.routineId) });
      const prev = qc.getQueryData<RoutineDetail | null>(
        routineKeys.detail(input.routineId),
      );
      patchDetail(qc, input.routineId, (d) =>
        mapDay(d, input.dayId, (day) => ({
          ...day,
          routine_exercises: day.routine_exercises.filter(
            (re) => re.id !== input.rowId,
          ),
        })),
      );
      return { prev };
    },
    onError: (_e, input, ctx) =>
      qc.setQueryData(routineKeys.detail(input.routineId), ctx?.prev),
    onSettled: (_d, _e, input) =>
      qc.invalidateQueries({ queryKey: routineKeys.detail(input.routineId) }),
  });
}

export function useUpdateRoutineExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      routineId: string;
      dayId: string;
      rowId: string;
      patch: Partial<
        Pick<
          RoutineExercise,
          "target_sets" | "target_reps_min" | "target_reps_max" | "notes"
        >
      >;
    }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("routine_exercises")
        .update(input.patch)
        .eq("id", input.rowId);
      if (error) throw error;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: routineKeys.detail(input.routineId) });
      const prev = qc.getQueryData<RoutineDetail | null>(
        routineKeys.detail(input.routineId),
      );
      patchDetail(qc, input.routineId, (d) =>
        mapDay(d, input.dayId, (day) => ({
          ...day,
          routine_exercises: day.routine_exercises.map((re) =>
            re.id === input.rowId ? { ...re, ...input.patch } : re,
          ),
        })),
      );
      return { prev };
    },
    onError: (_e, input, ctx) =>
      qc.setQueryData(routineKeys.detail(input.routineId), ctx?.prev),
    onSettled: (_d, _e, input) =>
      qc.invalidateQueries({ queryKey: routineKeys.detail(input.routineId) }),
  });
}

export function useSwapExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      routineId: string;
      dayId: string;
      rowId: string;
      newExerciseId: string;
    }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("routine_exercises")
        .update({ exercise_id: input.newExerciseId })
        .eq("id", input.rowId);
      if (error) throw error;
    },
    onSettled: (_d, _e, input) =>
      qc.invalidateQueries({ queryKey: routineKeys.detail(input.routineId) }),
  });
}

export function useReorderExercises() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      routineId: string;
      dayId: string;
      orderedRowIds: string[];
    }) => {
      const supabase = createClient();
      await Promise.all(
        input.orderedRowIds.map((id, i) =>
          supabase.from("routine_exercises").update({ position: i }).eq("id", id),
        ),
      );
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: routineKeys.detail(input.routineId) });
      const prev = qc.getQueryData<RoutineDetail | null>(
        routineKeys.detail(input.routineId),
      );
      patchDetail(qc, input.routineId, (d) =>
        mapDay(d, input.dayId, (day) => {
          const byId = new Map(day.routine_exercises.map((re) => [re.id, re]));
          const list = input.orderedRowIds
            .map((id, i) => {
              const re = byId.get(id);
              return re ? { ...re, position: i } : null;
            })
            .filter(Boolean) as RoutineExercise[];
          return { ...day, routine_exercises: list };
        }),
      );
      return { prev };
    },
    onError: (_e, input, ctx) =>
      qc.setQueryData(routineKeys.detail(input.routineId), ctx?.prev),
    onSettled: (_d, _e, input) =>
      qc.invalidateQueries({ queryKey: routineKeys.detail(input.routineId) }),
  });
}
