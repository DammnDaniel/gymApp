-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  GymApp · Migración inicial (Fase 1)                              ║
-- ║  Tablas + RLS + índices. Pegar entero en Supabase → SQL Editor.   ║
-- ╚══════════════════════════════════════════════════════════════════╝

create extension if not exists citext;

-- ─── PERFILES ───────────────────────────────────────────────
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     citext unique not null,
  email        text not null,
  display_name text not null,
  avatar_url   text,
  unit_system  text not null default 'metric',   -- metric | imperial
  created_at   timestamptz default now()
);

-- ─── BIBLIOTECA DE EJERCICIOS (catálogo + custom) ───────────
create table exercises (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  name              text not null,
  force             text, level text, mechanic text, equipment text,
  primary_muscles   text[] default '{}',
  secondary_muscles text[] default '{}',
  instructions      text[] default '{}',
  category          text,
  image_start       text,     -- frame inicio
  image_end         text,     -- frame fin  (animación 2 frames)
  video_url         text,     -- tutorial opcional
  tips              text,     -- consejos
  is_custom         boolean default false,
  owner_id          uuid references profiles(id) on delete cascade,  -- NULL = catálogo
  created_at        timestamptz default now()
);

-- ─── RUTINAS ────────────────────────────────────────────────
create table routines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null, description text, is_active boolean default true,
  created_at timestamptz default now()
);
create table routine_days (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references routines(id) on delete cascade,
  position int not null, name text not null, focus text
);
create table routine_exercises (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references routine_days(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,
  position int not null,
  target_sets int, target_reps_min int, target_reps_max int, notes text
);

-- ─── REGISTRO DE ENTRENOS ───────────────────────────────────
create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  routine_day_id uuid references routine_days(id) on delete set null,
  performed_at timestamptz default now(), duration_seconds int, notes text
);
create table set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references workout_sessions(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,
  set_number int not null, weight_kg numeric(6,2), reps int, rpe numeric(3,1),
  is_warmup boolean default false, created_at timestamptz default now()
);

-- ─── PESO CORPORAL (base de progreso / dieta futura) ────────
create table bodyweight_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  measured_at date not null default current_date,
  weight_kg numeric(5,2) not null, unique (owner_id, measured_at)
);

create index on set_logs (exercise_id);
create index on set_logs (session_id);
create index on workout_sessions (owner_id, performed_at desc);
create index on routine_exercises (day_id, position);

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  RLS · cada perfil solo ve lo suyo (catálogo de ejercicios       ║
-- ║  es lectura pública para usuarios autenticados).                 ║
-- ╚══════════════════════════════════════════════════════════════════╝
alter table profiles enable row level security;
alter table exercises enable row level security;
alter table routines enable row level security;
alter table routine_days enable row level security;
alter table routine_exercises enable row level security;
alter table workout_sessions enable row level security;
alter table set_logs enable row level security;
alter table bodyweight_logs enable row level security;

create policy "own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "read catalog or own" on exercises
  for select using (owner_id is null or owner_id = auth.uid());
create policy "manage own custom" on exercises
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own routines" on routines
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own routine_days" on routine_days for all using (
  exists (select 1 from routines r where r.id = routine_id and r.owner_id = auth.uid()));
create policy "own routine_exercises" on routine_exercises for all using (
  exists (select 1 from routine_days d join routines r on r.id = d.routine_id
          where d.id = day_id and r.owner_id = auth.uid()));

create policy "own sessions" on workout_sessions
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own set_logs" on set_logs for all using (
  exists (select 1 from workout_sessions s where s.id = session_id and s.owner_id = auth.uid()));
create policy "own bodyweight" on bodyweight_logs
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
