-- ============================================================================
-- PulseFit — Row Level Security
-- Migración: 0002_rls_policies
-- Descripción: Habilita RLS y define quién puede leer/escribir cada tabla.
-- Reglas generales:
--   - Un atleta solo ve y edita sus propios datos.
--   - Un coach ve y gestiona los datos de los atletas que tiene asignados
--     (profiles.coach_id = coach) y sus propias plantillas de rutina.
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.routine_templates enable row level security;
alter table public.routine_template_days enable row level security;
alter table public.routine_template_exercises enable row level security;
alter table public.assigned_routines enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.exercise_logs enable row level security;

-- ----------------------------------------------------------------------------
-- PROFILES
-- ----------------------------------------------------------------------------
create policy "profiles: ver el propio perfil, el de tu coach o el de tus atletas"
  on public.profiles for select
  using (
    id = auth.uid()
    or coach_id = auth.uid()
    or id = (select coach_id from public.profiles where id = auth.uid())
  );

create policy "profiles: insertar solo el propio perfil"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles: actualizar solo el propio perfil"
  on public.profiles for update
  using (id = auth.uid());

-- ----------------------------------------------------------------------------
-- ROUTINE_TEMPLATES
-- ----------------------------------------------------------------------------
create policy "templates: el coach ve las suyas, el atleta ve las asignadas"
  on public.routine_templates for select
  using (
    coach_id = auth.uid()
    or exists (
      select 1 from public.assigned_routines ar
      where ar.template_id = routine_templates.id
        and ar.athlete_id = auth.uid()
    )
  );

create policy "templates: el coach crea las suyas"
  on public.routine_templates for insert
  with check (coach_id = auth.uid());

create policy "templates: el coach edita las suyas"
  on public.routine_templates for update
  using (coach_id = auth.uid());

create policy "templates: el coach elimina las suyas"
  on public.routine_templates for delete
  using (coach_id = auth.uid());

-- ----------------------------------------------------------------------------
-- ROUTINE_TEMPLATE_DAYS (hereda visibilidad de la plantilla)
-- ----------------------------------------------------------------------------
create policy "template_days: visibles si la plantilla es visible"
  on public.routine_template_days for select
  using (
    exists (
      select 1 from public.routine_templates t
      where t.id = routine_template_days.template_id
        and (
          t.coach_id = auth.uid()
          or exists (
            select 1 from public.assigned_routines ar
            where ar.template_id = t.id and ar.athlete_id = auth.uid()
          )
        )
    )
  );

create policy "template_days: el coach dueño de la plantilla gestiona sus días"
  on public.routine_template_days for all
  using (
    exists (
      select 1 from public.routine_templates t
      where t.id = routine_template_days.template_id and t.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.routine_templates t
      where t.id = routine_template_days.template_id and t.coach_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- ROUTINE_TEMPLATE_EXERCISES (hereda visibilidad del día -> plantilla)
-- ----------------------------------------------------------------------------
create policy "template_exercises: visibles si el día es visible"
  on public.routine_template_exercises for select
  using (
    exists (
      select 1
      from public.routine_template_days d
      join public.routine_templates t on t.id = d.template_id
      where d.id = routine_template_exercises.template_day_id
        and (
          t.coach_id = auth.uid()
          or exists (
            select 1 from public.assigned_routines ar
            where ar.template_id = t.id and ar.athlete_id = auth.uid()
          )
        )
    )
  );

create policy "template_exercises: el coach dueño gestiona sus ejercicios"
  on public.routine_template_exercises for all
  using (
    exists (
      select 1
      from public.routine_template_days d
      join public.routine_templates t on t.id = d.template_id
      where d.id = routine_template_exercises.template_day_id and t.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.routine_template_days d
      join public.routine_templates t on t.id = d.template_id
      where d.id = routine_template_exercises.template_day_id and t.coach_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- ASSIGNED_ROUTINES
-- ----------------------------------------------------------------------------
create policy "assigned_routines: el atleta y su coach pueden verla"
  on public.assigned_routines for select
  using (athlete_id = auth.uid() or coach_id = auth.uid());

create policy "assigned_routines: solo el coach asigna"
  on public.assigned_routines for insert
  with check (coach_id = auth.uid());

create policy "assigned_routines: solo el coach edita"
  on public.assigned_routines for update
  using (coach_id = auth.uid());

-- ----------------------------------------------------------------------------
-- WORKOUT_SESSIONS
-- ----------------------------------------------------------------------------
create policy "sessions: el atleta ve y crea las suyas, su coach las ve"
  on public.workout_sessions for select
  using (
    athlete_id = auth.uid()
    or exists (
      select 1 from public.assigned_routines ar
      where ar.id = workout_sessions.assigned_routine_id and ar.coach_id = auth.uid()
    )
  );

create policy "sessions: el atleta crea las suyas"
  on public.workout_sessions for insert
  with check (athlete_id = auth.uid());

create policy "sessions: el atleta actualiza las suyas"
  on public.workout_sessions for update
  using (athlete_id = auth.uid());

-- ----------------------------------------------------------------------------
-- EXERCISE_LOGS (hereda propiedad de la sesión)
-- ----------------------------------------------------------------------------
create policy "exercise_logs: visibles si la sesión es visible"
  on public.exercise_logs for select
  using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = exercise_logs.session_id
        and (
          s.athlete_id = auth.uid()
          or exists (
            select 1 from public.assigned_routines ar
            where ar.id = s.assigned_routine_id and ar.coach_id = auth.uid()
          )
        )
    )
  );

create policy "exercise_logs: el dueño de la sesión registra y actualiza"
  on public.exercise_logs for all
  using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = exercise_logs.session_id and s.athlete_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_sessions s
      where s.id = exercise_logs.session_id and s.athlete_id = auth.uid()
    )
  );
