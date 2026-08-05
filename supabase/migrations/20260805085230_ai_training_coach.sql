-- Conversaciones del coach, propuestas auditables y aplicación atómica.
-- Todas las tablas están expuestas únicamente al usuario propietario mediante RLS.

create table public.coach_threads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Nueva conversación' check (char_length(title) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.coach_threads(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 16000),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create table public.coach_memories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('preference', 'limitation', 'goal', 'equipment', 'schedule')),
  content text not null check (char_length(content) between 2 and 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, category, content)
);

create table public.routine_change_proposals (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.coach_threads(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  routine_id uuid not null references public.routines(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'applied', 'rejected', 'undone')),
  title text not null check (char_length(title) between 1 and 160),
  summary text not null check (char_length(summary) between 1 and 4000),
  operations jsonb not null check (jsonb_typeof(operations) = 'array'),
  before_snapshot jsonb,
  after_snapshot jsonb,
  model text,
  created_at timestamptz not null default now(),
  applied_at timestamptz,
  undone_at timestamptz
);

create index coach_threads_owner_updated_idx
  on public.coach_threads (owner_id, updated_at desc);
create index coach_messages_thread_created_idx
  on public.coach_messages (thread_id, created_at);
create index coach_messages_owner_created_idx
  on public.coach_messages (owner_id, created_at desc);
create index coach_memories_owner_updated_idx
  on public.coach_memories (owner_id, updated_at desc);
create index routine_change_proposals_owner_created_idx
  on public.routine_change_proposals (owner_id, created_at desc);
create index routine_change_proposals_thread_idx
  on public.routine_change_proposals (thread_id, created_at);

grant select, insert, update, delete on public.coach_threads to authenticated;
grant select, insert, delete on public.coach_messages to authenticated;
grant select, insert, update, delete on public.coach_memories to authenticated;
grant select, insert, update on public.routine_change_proposals to authenticated;

alter table public.coach_threads enable row level security;
alter table public.coach_messages enable row level security;
alter table public.coach_memories enable row level security;
alter table public.routine_change_proposals enable row level security;

create policy "coach threads select own"
  on public.coach_threads for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "coach threads insert own"
  on public.coach_threads for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "coach threads update own"
  on public.coach_threads for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "coach threads delete own"
  on public.coach_threads for delete to authenticated
  using ((select auth.uid()) = owner_id);

create policy "coach messages select own"
  on public.coach_messages for select to authenticated
  using (
    (select auth.uid()) = owner_id
    and exists (
      select 1 from public.coach_threads t
      where t.id = thread_id and t.owner_id = (select auth.uid())
    )
  );
create policy "coach messages insert own"
  on public.coach_messages for insert to authenticated
  with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1 from public.coach_threads t
      where t.id = thread_id and t.owner_id = (select auth.uid())
    )
  );
create policy "coach messages delete own"
  on public.coach_messages for delete to authenticated
  using ((select auth.uid()) = owner_id);

create policy "coach memories select own"
  on public.coach_memories for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "coach memories insert own"
  on public.coach_memories for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "coach memories update own"
  on public.coach_memories for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "coach memories delete own"
  on public.coach_memories for delete to authenticated
  using ((select auth.uid()) = owner_id);

create policy "coach proposals select own"
  on public.routine_change_proposals for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "coach proposals insert own"
  on public.routine_change_proposals for insert to authenticated
  with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1 from public.routines r
      where r.id = routine_id and r.owner_id = (select auth.uid())
    )
  );
create policy "coach proposals update own"
  on public.routine_change_proposals for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create or replace function public.coach_routine_snapshot(p_routine_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', re.id,
        'day_id', re.day_id,
        'exercise_id', re.exercise_id,
        'position', re.position,
        'target_sets', re.target_sets,
        'target_reps_min', re.target_reps_min,
        'target_reps_max', re.target_reps_max,
        'notes', re.notes
      ) order by d.position, re.position, re.id
    ),
    '[]'::jsonb
  )
  from public.routine_exercises re
  join public.routine_days d on d.id = re.day_id
  where d.routine_id = p_routine_id;
$$;

create or replace function public.apply_coach_routine_proposal(p_proposal_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  proposal public.routine_change_proposals%rowtype;
  operation jsonb;
  operation_type text;
  target_id uuid;
  target_day_id uuid;
  target_exercise_id uuid;
  before_state jsonb;
  after_state jsonb;
begin
  if (select auth.uid()) is null then
    raise exception 'Sesión no válida';
  end if;

  select * into proposal
  from public.routine_change_proposals
  where id = p_proposal_id and owner_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'Propuesta no encontrada';
  end if;
  if proposal.status <> 'pending' then
    raise exception 'La propuesta ya no está pendiente';
  end if;
  if not exists (
    select 1 from public.routines r
    where r.id = proposal.routine_id and r.owner_id = (select auth.uid())
  ) then
    raise exception 'Solo puedes modificar una rutina propia';
  end if;

  before_state := public.coach_routine_snapshot(proposal.routine_id);

  for operation in select value from jsonb_array_elements(proposal.operations)
  loop
    operation_type := operation->>'type';
    target_id := nullif(operation->>'routine_exercise_id', '')::uuid;
    target_day_id := nullif(operation->>'day_id', '')::uuid;
    target_exercise_id := nullif(operation->>'exercise_id', '')::uuid;

    if operation_type in ('replace_exercise', 'remove_exercise', 'update_prescription', 'move_exercise') then
      if target_id is null or not exists (
        select 1
        from public.routine_exercises re
        join public.routine_days d on d.id = re.day_id
        where re.id = target_id and d.routine_id = proposal.routine_id
      ) then
        raise exception 'Un ejercicio de la propuesta ya no existe en esta rutina';
      end if;
    end if;

    if operation_type in ('add_exercise', 'move_exercise') then
      if target_day_id is null or not exists (
        select 1 from public.routine_days d
        where d.id = target_day_id and d.routine_id = proposal.routine_id
      ) then
        raise exception 'El día indicado no pertenece a esta rutina';
      end if;
    end if;

    if operation_type in ('add_exercise', 'replace_exercise') then
      if target_exercise_id is null or not exists (
        select 1 from public.exercises e where e.id = target_exercise_id
      ) then
        raise exception 'El ejercicio propuesto no está disponible';
      end if;
    end if;

    case operation_type
      when 'replace_exercise' then
        update public.routine_exercises
        set exercise_id = target_exercise_id,
            target_sets = coalesce(nullif(operation->>'target_sets', '')::int, target_sets),
            target_reps_min = coalesce(nullif(operation->>'target_reps_min', '')::int, target_reps_min),
            target_reps_max = coalesce(nullif(operation->>'target_reps_max', '')::int, target_reps_max),
            notes = coalesce(operation->>'notes', notes)
        where id = target_id;

      when 'add_exercise' then
        insert into public.routine_exercises (
          id, day_id, exercise_id, position,
          target_sets, target_reps_min, target_reps_max, notes
        ) values (
          gen_random_uuid(), target_day_id, target_exercise_id,
          coalesce(nullif(operation->>'position', '')::int, 999),
          coalesce(nullif(operation->>'target_sets', '')::int, 3),
          nullif(operation->>'target_reps_min', '')::int,
          nullif(operation->>'target_reps_max', '')::int,
          nullif(operation->>'notes', '')
        );

      when 'remove_exercise' then
        delete from public.routine_exercises where id = target_id;

      when 'update_prescription' then
        update public.routine_exercises
        set target_sets = coalesce(nullif(operation->>'target_sets', '')::int, target_sets),
            target_reps_min = coalesce(nullif(operation->>'target_reps_min', '')::int, target_reps_min),
            target_reps_max = coalesce(nullif(operation->>'target_reps_max', '')::int, target_reps_max),
            notes = coalesce(operation->>'notes', notes)
        where id = target_id;

      when 'move_exercise' then
        update public.routine_exercises
        set day_id = target_day_id,
            position = coalesce(nullif(operation->>'position', '')::int, position)
        where id = target_id;

      else
        raise exception 'Operación de rutina no admitida: %', operation_type;
    end case;
  end loop;

  with ranked as (
    select re.id,
           row_number() over (partition by re.day_id order by re.position, re.id) - 1 as new_position
    from public.routine_exercises re
    join public.routine_days d on d.id = re.day_id
    where d.routine_id = proposal.routine_id
  )
  update public.routine_exercises re
  set position = ranked.new_position
  from ranked
  where re.id = ranked.id;

  after_state := public.coach_routine_snapshot(proposal.routine_id);

  update public.routine_change_proposals
  set status = 'applied',
      before_snapshot = before_state,
      after_snapshot = after_state,
      applied_at = now(),
      undone_at = null
  where id = proposal.id;

  return jsonb_build_object(
    'proposal_id', proposal.id,
    'routine_id', proposal.routine_id,
    'status', 'applied'
  );
end;
$$;

create or replace function public.undo_coach_routine_proposal(p_proposal_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  proposal public.routine_change_proposals%rowtype;
  current_state jsonb;
  previous_row jsonb;
begin
  if (select auth.uid()) is null then
    raise exception 'Sesión no válida';
  end if;

  select * into proposal
  from public.routine_change_proposals
  where id = p_proposal_id and owner_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'Propuesta no encontrada';
  end if;
  if proposal.status <> 'applied' then
    raise exception 'Esta propuesta no se puede deshacer';
  end if;

  current_state := public.coach_routine_snapshot(proposal.routine_id);
  if current_state is distinct from proposal.after_snapshot then
    raise exception 'La rutina ha cambiado después. No se puede deshacer sin sobrescribir cambios posteriores';
  end if;

  delete from public.routine_exercises re
  using public.routine_days d
  where re.day_id = d.id and d.routine_id = proposal.routine_id;

  for previous_row in select value from jsonb_array_elements(proposal.before_snapshot)
  loop
    insert into public.routine_exercises (
      id, day_id, exercise_id, position,
      target_sets, target_reps_min, target_reps_max, notes
    ) values (
      (previous_row->>'id')::uuid,
      (previous_row->>'day_id')::uuid,
      (previous_row->>'exercise_id')::uuid,
      (previous_row->>'position')::int,
      nullif(previous_row->>'target_sets', '')::int,
      nullif(previous_row->>'target_reps_min', '')::int,
      nullif(previous_row->>'target_reps_max', '')::int,
      previous_row->>'notes'
    );
  end loop;

  update public.routine_change_proposals
  set status = 'undone', undone_at = now()
  where id = proposal.id;

  return jsonb_build_object(
    'proposal_id', proposal.id,
    'routine_id', proposal.routine_id,
    'status', 'undone'
  );
end;
$$;

revoke all on function public.coach_routine_snapshot(uuid) from public;
revoke all on function public.apply_coach_routine_proposal(uuid) from public;
revoke all on function public.undo_coach_routine_proposal(uuid) from public;
grant execute on function public.coach_routine_snapshot(uuid) to authenticated;
grant execute on function public.apply_coach_routine_proposal(uuid) to authenticated;
grant execute on function public.undo_coach_routine_proposal(uuid) to authenticated;
