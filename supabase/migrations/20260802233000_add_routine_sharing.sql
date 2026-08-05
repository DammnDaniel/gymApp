create table public.routine_shares (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  shared_with uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (routine_id, shared_with)
);

create index routine_shares_shared_with_idx
  on public.routine_shares (shared_with);

alter table public.routine_shares enable row level security;
revoke all on table public.routine_shares from anon, authenticated;
grant select on table public.routine_shares to authenticated;

create policy "read shares addressed to me"
  on public.routine_shares for select to authenticated
  using (shared_with = (select auth.uid()));

create policy "read shared routines"
  on public.routines for select to authenticated
  using (exists (
    select 1 from public.routine_shares rs
    where rs.routine_id = routines.id
      and rs.shared_with = (select auth.uid())
  ));

create policy "read shared routine days"
  on public.routine_days for select to authenticated
  using (exists (
    select 1 from public.routine_shares rs
    where rs.routine_id = routine_days.routine_id
      and rs.shared_with = (select auth.uid())
  ));

create policy "read shared routine exercises"
  on public.routine_exercises for select to authenticated
  using (exists (
    select 1
    from public.routine_days rd
    join public.routine_shares rs on rs.routine_id = rd.routine_id
    where rd.id = routine_exercises.day_id
      and rs.shared_with = (select auth.uid())
  ));

create policy "read custom exercises in shared routines"
  on public.exercises for select to authenticated
  using (exists (
    select 1
    from public.routine_exercises re
    join public.routine_days rd on rd.id = re.day_id
    join public.routine_shares rs on rs.routine_id = rd.routine_id
    where re.exercise_id = exercises.id
      and rs.shared_with = (select auth.uid())
  ));

insert into public.routine_shares (routine_id, shared_with)
select r.id, daniel.id
from public.routines r
join public.profiles elena on elena.id = r.owner_id
join public.profiles daniel on lower(daniel.username) = 'daniel'
where lower(elena.username) = 'elena' and r.is_active
on conflict (routine_id, shared_with) do nothing;
