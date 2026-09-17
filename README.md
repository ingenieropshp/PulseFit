# PulseFit

Aplicación real de coaching de gimnasio: los atletas ven y registran su rutina
del día, y los entrenadores gestionan atletas, crean rutinas base y las
asignan con parámetros personalizados (RPE, duración, notas).

Stack: **React 18 + TypeScript + Vite + Tailwind CSS + React Router + Supabase**
(Postgres + Auth + Row Level Security).

## 1. Requisitos

- Node.js 18 o superior
- Una cuenta de Supabase (ya se creó un proyecto para ti, ver abajo)

## 2. Instalación

```bash
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

## 3. Conexión a Supabase

El archivo `.env` ya viene configurado con la URL y la clave pública
("anon"/"publishable") del proyecto de Supabase creado para PulseFit:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Esta clave es segura de exponer en el cliente (es la clave pública, no la
`service_role`). Si en algún momento quieres apuntar a otro proyecto de
Supabase, solo reemplaza estos dos valores.

## 4. Base de datos

Las migraciones SQL están en `supabase/migrations/`, en orden:

1. `0001_initial_schema.sql` — tablas: `profiles`, `routine_templates`,
   `routine_template_days`, `routine_template_exercises`,
   `assigned_routines`, `workout_sessions`, `exercise_logs`, y el trigger que
   crea automáticamente el perfil de cada usuario nuevo.
2. `0002_rls_policies.sql` — Row Level Security: cada atleta solo ve sus
   propios datos, cada coach solo ve a sus propios atletas y rutinas.
3. `0003_security_fixes.sql` — endurece las funciones del trigger (fija
   `search_path`, evita permisos de ejecución innecesarios).

Ya están aplicadas en el proyecto de Supabase conectado en `.env`. Si alguna
vez necesitas recrear la base desde cero (por ejemplo en un proyecto de
Supabase nuevo), ejecútalas en ese orden desde el SQL Editor de Supabase, o
con la CLI de Supabase (`supabase db push`).

## 5. Estructura del proyecto

```
src/
  components/     Componentes compartidos (BottomNav, ProtectedRoute)
  context/        AuthContext (sesión, perfil, login/registro/logout)
  hooks/          Lógica de datos: useTodayWorkout, useCoachAthletes, useCoachTemplates
  lib/            Cliente de Supabase
  types/          Tipos generados de la base de datos + tipos de dominio
  views/          Las 4 pantallas: AuthView, ClientDashboard, CoachDashboard, AssignRoutine
  App.tsx         Rutas de la aplicación
  main.tsx        Punto de entrada
supabase/
  migrations/     Migraciones SQL, listas para ejecutar
```

## 6. Pantallas

- **`/auth`** — Login y registro, con selector de rol (Atleta / Coach).
- **`/dashboard`** — Panel del atleta: rutina de hoy con checklist, timer de
  descanso, progreso semanal, racha, y pestaña de perfil.
- **`/coach`** — Panel del entrenador: lista de atletas con estado de
  cumplimiento, biblioteca de rutinas base, crear nueva rutina.
- **`/coach/assign/:athleteId`** — Asignar una rutina base a un atleta con
  fecha de inicio, duración, RPE objetivo y notas.

## 7. Pendientes conocidos (no incluidos en esta entrega)

- **Vincular atleta → coach**: al registrarse, un atleta todavía no queda
  automáticamente asociado a un coach (`coach_id` queda vacío). Falta decidir
  el mecanismo (código de invitación, aprobación manual desde el panel del
  coach, etc.) antes de que el Panel del Entrenador muestre atletas reales.
- **Editor de días/ejercicios de una rutina base**: hoy se puede crear una
  rutina base (nombre, días por semana, nivel, descripción) desde el Panel
  del Entrenador, pero todavía no hay una pantalla para cargar los ejercicios
  de cada día — hace falta para que "Asignar Rutina" tenga contenido real que
  mostrarle al atleta.
- El proyecto de Supabase llamado "financeflow" quedó pausado para poder
  crear el de PulseFit (el plan gratuito permite solo 2 proyectos activos).
  Puedes reactivarlo cuando quieras desde el dashboard de Supabase.

## 8. Comandos disponibles

```bash
npm run dev        # servidor de desarrollo
npm run build       # build de producción (incluye typecheck)
npm run typecheck   # solo typecheck
npm run lint         # linter
npm run preview      # sirve el build de producción localmente
```
