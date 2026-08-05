-- Save a workout and every set in one transaction. If one row is invalid,
-- PostgreSQL rolls the entire operation back and no empty session remains.
create or replace function public.save_workout_session(
  p_day_id uuid,
  p_duration_seconds integer,
  p_sets jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid := gen_random_uuid();
  v_set_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.routine_days rd
    join public.routines r on r.id = rd.routine_id
    where rd.id = p_day_id and r.owner_id = v_user_id
  ) then
    raise exception 'Workout day not found' using errcode = '42501';
  end if;

  if p_duration_seconds is not null
     and (p_duration_seconds < 0 or p_duration_seconds > 86400) then
    raise exception 'Invalid workout duration' using errcode = '22023';
  end if;

  if p_sets is null or jsonb_typeof(p_sets) <> 'array' then
    raise exception 'Sets must be a JSON array' using errcode = '22023';
  end if;

  v_set_count := jsonb_array_length(p_sets);
  if v_set_count < 1 or v_set_count > 200 then
    raise exception 'Workout must contain between 1 and 200 sets'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_sets) as s(
      exercise_id uuid,
      set_number integer,
      weight_kg numeric,
      reps integer,
      rpe numeric,
      duration_seconds integer,
      is_warmup boolean
    )
    where s.exercise_id is null
       or s.set_number is null
       or s.set_number < 1
       or s.set_number > 100
       or (s.weight_kg is not null and (s.weight_kg < 0 or s.weight_kg > 1000))
       or (s.reps is not null and (s.reps < 0 or s.reps > 1000))
       or (s.rpe is not null and (s.rpe < 0 or s.rpe > 10))
       or (s.duration_seconds is not null and (s.duration_seconds < 1 or s.duration_seconds > 86400))
       or (s.weight_kg is null and s.reps is null and s.duration_seconds is null)
       or not exists (
         select 1 from public.routine_exercises re
         where re.day_id = p_day_id and re.exercise_id = s.exercise_id
       )
  ) then
    raise exception 'One or more sets are invalid' using errcode = '22023';
  end if;

  insert into public.workout_sessions (
    id, owner_id, routine_day_id, duration_seconds
  ) values (
    v_session_id, v_user_id, p_day_id, p_duration_seconds
  );

  insert into public.set_logs (
    id, session_id, exercise_id, set_number, weight_kg, reps, rpe,
    duration_seconds, is_warmup
  )
  select
    gen_random_uuid(), v_session_id, s.exercise_id, s.set_number,
    s.weight_kg, s.reps, s.rpe, s.duration_seconds,
    coalesce(s.is_warmup, false)
  from jsonb_to_recordset(p_sets) as s(
    exercise_id uuid,
    set_number integer,
    weight_kg numeric,
    reps integer,
    rpe numeric,
    duration_seconds integer,
    is_warmup boolean
  );

  return v_session_id;
end;
$$;

revoke all on function public.save_workout_session(uuid, integer, jsonb)
  from public, anon;
grant execute on function public.save_workout_session(uuid, integer, jsonb)
  to authenticated;

create index if not exists workout_sessions_routine_day_id_idx
  on public.workout_sessions (routine_day_id);
