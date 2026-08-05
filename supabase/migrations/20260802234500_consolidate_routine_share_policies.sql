-- Keep one permissive policy per role/action to avoid duplicate evaluation.
drop policy if exists "read catalog or own" on public.exercises;
drop policy if exists "read custom exercises in shared routines" on public.exercises;
drop policy if exists "manage own custom" on public.exercises;
drop policy if exists "insert own custom" on public.exercises;
drop policy if exists "update own custom" on public.exercises;
drop policy if exists "delete own custom" on public.exercises;

create policy "read available exercises" on public.exercises
  for select to authenticated using (
    owner_id is null or owner_id = (select auth.uid()) or exists (
      select 1 from public.routine_exercises re
      join public.routine_days rd on rd.id = re.day_id
      join public.routine_shares rs on rs.routine_id = rd.routine_id
      where re.exercise_id = exercises.id
        and rs.shared_with = (select auth.uid())
    )
  );
create policy "insert own custom" on public.exercises
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "update own custom" on public.exercises
  for update to authenticated using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy "delete own custom" on public.exercises
  for delete to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "own routines" on public.routines;
drop policy if exists "read shared routines" on public.routines;
create policy "read own or shared routines" on public.routines
  for select to authenticated using (
    owner_id = (select auth.uid()) or exists (
      select 1 from public.routine_shares rs
      where rs.routine_id = routines.id
        and rs.shared_with = (select auth.uid())
    )
  );
create policy "insert own routines" on public.routines
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "update own routines" on public.routines
  for update to authenticated using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy "delete own routines" on public.routines
  for delete to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "own routine_days" on public.routine_days;
drop policy if exists "read shared routine days" on public.routine_days;
create policy "read own or shared routine days" on public.routine_days
  for select to authenticated using (
    exists (select 1 from public.routines r
      where r.id = routine_days.routine_id
        and r.owner_id = (select auth.uid()))
    or exists (select 1 from public.routine_shares rs
      where rs.routine_id = routine_days.routine_id
        and rs.shared_with = (select auth.uid()))
  );
create policy "insert own routine days" on public.routine_days
  for insert to authenticated with check (exists (
    select 1 from public.routines r where r.id = routine_days.routine_id
      and r.owner_id = (select auth.uid())
  ));
create policy "update own routine days" on public.routine_days
  for update to authenticated using (exists (
    select 1 from public.routines r where r.id = routine_days.routine_id
      and r.owner_id = (select auth.uid())
  )) with check (exists (
    select 1 from public.routines r where r.id = routine_days.routine_id
      and r.owner_id = (select auth.uid())
  ));
create policy "delete own routine days" on public.routine_days
  for delete to authenticated using (exists (
    select 1 from public.routines r where r.id = routine_days.routine_id
      and r.owner_id = (select auth.uid())
  ));

drop policy if exists "own routine_exercises" on public.routine_exercises;
drop policy if exists "read shared routine exercises" on public.routine_exercises;
create policy "read own or shared routine exercises" on public.routine_exercises
  for select to authenticated using (
    exists (select 1 from public.routine_days rd
      join public.routines r on r.id = rd.routine_id
      where rd.id = routine_exercises.day_id
        and r.owner_id = (select auth.uid()))
    or exists (select 1 from public.routine_days rd
      join public.routine_shares rs on rs.routine_id = rd.routine_id
      where rd.id = routine_exercises.day_id
        and rs.shared_with = (select auth.uid()))
  );
create policy "insert own routine exercises" on public.routine_exercises
  for insert to authenticated with check (exists (
    select 1 from public.routine_days rd
    join public.routines r on r.id = rd.routine_id
    where rd.id = routine_exercises.day_id
      and r.owner_id = (select auth.uid())
  ));
create policy "update own routine exercises" on public.routine_exercises
  for update to authenticated using (exists (
    select 1 from public.routine_days rd
    join public.routines r on r.id = rd.routine_id
    where rd.id = routine_exercises.day_id
      and r.owner_id = (select auth.uid())
  )) with check (exists (
    select 1 from public.routine_days rd
    join public.routines r on r.id = rd.routine_id
    where rd.id = routine_exercises.day_id
      and r.owner_id = (select auth.uid())
  ));
create policy "delete own routine exercises" on public.routine_exercises
  for delete to authenticated using (exists (
    select 1 from public.routine_days rd
    join public.routines r on r.id = rd.routine_id
    where rd.id = routine_exercises.day_id
      and r.owner_id = (select auth.uid())
  ));
