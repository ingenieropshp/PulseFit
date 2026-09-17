import type { Tables } from './database'

// Alias legibles sobre las filas generadas por Supabase.
export type Role = 'atleta' | 'coach'
export type Level = 'Principiante' | 'Intermedio' | 'Avanzado' | 'Elite'
export type RoutineStatus = 'active' | 'completed' | 'cancelled'

export type Profile = Omit<Tables<'profiles'>, 'role' | 'level'> & {
  role: Role
  level: Level | null
}

export type RoutineTemplate = Tables<'routine_templates'>
export type RoutineTemplateDay = Tables<'routine_template_days'>
export type RoutineTemplateExercise = Tables<'routine_template_exercises'>
export type AssignedRoutine = Omit<Tables<'assigned_routines'>, 'status'> & {
  status: RoutineStatus
}
export type WorkoutSession = Tables<'workout_sessions'>
export type ExerciseLog = Tables<'exercise_logs'>

// Forma "hidratada" que usa el Dashboard del Cliente: la rutina de hoy con
// todos sus ejercicios y el estado de cada uno ya resuelto.
export type TodayExercise = RoutineTemplateExercise & {
  log: ExerciseLog | null
}

export type TodayWorkout = {
  assignedRoutine: AssignedRoutine
  template: RoutineTemplate
  day: RoutineTemplateDay
  session: WorkoutSession
  exercises: TodayExercise[]
}

// Fila enriquecida que usa el Panel del Entrenador (perfil + progreso semanal).
export type AthleteSummary = Profile & {
  activeRoutine: AssignedRoutine | null
  weeklyCompletionPercent: number
  sessionsThisWeek: number
  sessionsPlannedThisWeek: number
  lastSessionAt: string | null
  status: 'up-to-date' | 'requires-adjustment' | 'inactive'
}
