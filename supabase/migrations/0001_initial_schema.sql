-- ============================================================================
-- PulseFit — Esquema inicial
-- Migración: 0001_initial_schema
-- Descripción: Perfiles (atleta/coach), plantillas de rutina, asignación de
-- rutinas a atletas, sesiones de entrenamiento y registro de ejercicios.
-- ============================================================================

-- Extensión necesaria para gen_random_uuid()
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. PROFILES
-- Un perfil por usuario de auth.users. El rol define si es atleta o coach.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('atleta', 'coach')),
  full_name text not null,
  avatar_url text,
  age int,
  weight_kg numeric(5, 2),
  level text check (level in ('Principiante', 'Intermedio', 'Avanzado', 'Elite')),
  goal text,
  -- Solo aplica a atletas: qué coach los gestiona.
  coach_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil de cada usuario (atleta o coach), 1:1 con auth.users.';

-- ----------------------------------------------------------------------------
-- 2. ROUTINE_TEMPLATES
-- Biblioteca de programas base que un coach puede reutilizar y asignar.
-- ----------------------------------------------------------------------------
create table if not exists public.routine_templates (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  days_per_week int not null default 1,
  level text check (level in ('Principiante', 'Intermedio', 'Avanzado', 'Elite')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. ROUTINE_TEMPLATE_DAYS
-- Cada día de entrenamiento dentro de una plantilla (ej. "Día 1: Pecho y Tríceps").
-- ----------------------------------------------------------------------------
create table if not exists public.routine_template_days (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.routine_templates (id) on delete cascade,
  -- 1 = Lunes ... 7 = Domingo (ISO), null si el día se asigna de forma rotativa (día 1, día 2...)
  day_of_week int check (day_of_week between 1 and 7),
  order_index int not null default 0,
  label text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. ROUTINE_TEMPLATE_EXERCISES
-- Ejercicios dentro de un día de plantilla.
-- ----------------------------------------------------------------------------
create table if not exists public.routine_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_day_id uuid not null references public.routine_template_days (id) on delete cascade,
  order_index int not null default 0,
  name text not null,
  sets int not null default 3,
  reps_min int not null default 8,
  reps_max int not null default 12,
  suggested_weight_kg numeric(6, 2),
  rest_seconds int not null default 60,
  image_url text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. ASSIGNED_ROUTINES
-- Instancia de una plantilla asignada a un atleta concreto.
-- ----------------------------------------------------------------------------
create table if not exists public.assigned_routines (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  coach_id uuid not null references public.profiles (id) on delete cascade,
  template_id uuid not null references public.routine_templates (id) on delete restrict,
  start_date date not null,
  duration_weeks int not null default 4 check (duration_weeks in (4, 8, 12)),
  target_rpe numeric(3, 1) not null default 8.0 check (target_rpe between 6 and 10),
  coach_notes text,
  push_notification boolean not null default true,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists assigned_routines_athlete_active_idx
  on public.assigned_routines (athlete_id)
  where status = 'active';

-- ----------------------------------------------------------------------------
-- 6. WORKOUT_SESSIONS
-- Una sesión real de entrenamiento (un día concreto) para un atleta.
-- ----------------------------------------------------------------------------
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  assigned_routine_id uuid not null references public.assigned_routines (id) on delete cascade,
  athlete_id uuid not null references public.profiles (id) on delete cascade,
  template_day_id uuid not null references public.routine_template_days (id) on delete restrict,
  session_date date not null default current_date,
  completed_at timestamptz,
  total_volume_kg numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (athlete_id, template_day_id, session_date)
);

create index if not exists workout_sessions_athlete_date_idx
  on public.workout_sessions (athlete_id, session_date desc);

-- ----------------------------------------------------------------------------
-- 7. EXERCISE_LOGS
-- Registro por ejercicio dentro de una sesión (si se completó, peso y reps reales).
-- ----------------------------------------------------------------------------
create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  template_exercise_id uuid not null references public.routine_template_exercises (id) on delete restrict,
  completed boolean not null default false,
  actual_weight_kg numeric(6, 2),
  actual_reps int,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (session_id, template_exercise_id)
);

-- ============================================================================
-- TRIGGER: crear automáticamente el perfil al registrarse en auth.users
-- Lee full_name y role desde raw_user_meta_data (enviados desde el formulario
-- de registro: supabase.auth.signUp({ options: { data: { full_name, role } } })).
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'atleta'),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- updated_at helper trigger
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at on public.routine_templates;
create trigger set_updated_at before update on public.routine_templates
  for each row execute procedure public.set_updated_at();
