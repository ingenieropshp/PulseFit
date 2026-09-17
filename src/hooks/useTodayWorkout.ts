import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import type {
  AssignedRoutine,
  ExerciseLog,
  RoutineTemplate,
  RoutineTemplateDay,
  RoutineTemplateExercise,
  TodayExercise,
  TodayWorkout,
  WorkoutSession,
} from '../types/models'

const todayISODate = () => new Date().toISOString().slice(0, 10)

/** Lunes=1 ... Domingo=7, igual que day_of_week en la BD. */
function isoDayOfWeek(date = new Date()): number {
  const jsDay = date.getDay() // 0=domingo..6=sábado
  return jsDay === 0 ? 7 : jsDay
}

function averageReps(minReps: number, maxReps: number) {
  return (minReps + maxReps) / 2
}

export interface DayActivity {
  label: string // L, M, X, J, V, S, D
  date: string
  isToday: boolean
  hasSession: boolean
  completed: boolean
}

interface UseTodayWorkoutResult {
  loading: boolean
  error: string | null
  workout: TodayWorkout | null
  isRestDay: boolean
  progressPercent: number
  streak: number
  weeklyVolumeKg: number
  weekActivity: DayActivity[]
  toggleExercise: (exercise: TodayExercise) => Promise<void>
  finishWorkout: () => Promise<void>
  refetch: () => Promise<void>
}

export function useTodayWorkout(): UseTodayWorkoutResult {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workout, setWorkout] = useState<TodayWorkout | null>(null)
  const [isRestDay, setIsRestDay] = useState(false)
  const [streak, setStreak] = useState(0)
  const [weeklyVolumeKg, setWeeklyVolumeKg] = useState(0)
  const [weekActivity, setWeekActivity] = useState<DayActivity[]>([])

  const load = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    setError(null)

    try {
      // 1. Rutina activa del atleta (la más reciente si hubiera varias).
      const { data: assignedRoutines, error: arError } = await supabase
        .from('assigned_routines')
        .select('*')
        .eq('athlete_id', profile.id)
        .eq('status', 'active')
        .lte('start_date', todayISODate())
        .order('start_date', { ascending: false })
        .limit(1)

      if (arError) throw arError
      const assignedRoutine = (assignedRoutines?.[0] as AssignedRoutine) ?? null

      if (!assignedRoutine) {
        setWorkout(null)
        setIsRestDay(false)
        setStreak(0)
        setWeeklyVolumeKg(0)
        return
      }

      // 2. Plantilla y día correspondiente a hoy.
      const { data: template, error: templateError } = await supabase
        .from('routine_templates')
        .select('*')
        .eq('id', assignedRoutine.template_id)
        .single()
      if (templateError) throw templateError

      const todayDow = isoDayOfWeek()
      const { data: days, error: daysError } = await supabase
        .from('routine_template_days')
        .select('*')
        .eq('template_id', assignedRoutine.template_id)
        .order('order_index', { ascending: true })
      if (daysError) throw daysError

      const day = (days ?? []).find((d) => d.day_of_week === todayDow) as
        | RoutineTemplateDay
        | undefined

      if (!day) {
        // Hoy no hay entrenamiento planificado (día de descanso).
        setWorkout(null)
        setIsRestDay(true)
      } else {
        setIsRestDay(false)

        // 3. Sesión de hoy: la busca, y si no existe la crea.
        const sessionDate = todayISODate()
        let { data: session } = await supabase
          .from('workout_sessions')
          .select('*')
          .eq('athlete_id', profile.id)
          .eq('template_day_id', day.id)
          .eq('session_date', sessionDate)
          .maybeSingle()

        if (!session) {
          const { data: newSession, error: insertError } = await supabase
            .from('workout_sessions')
            .insert({
              assigned_routine_id: assignedRoutine.id,
              athlete_id: profile.id,
              template_day_id: day.id,
              session_date: sessionDate,
            })
            .select('*')
            .single()
          if (insertError) throw insertError
          session = newSession
        }

        // 4. Ejercicios del día + logs existentes de la sesión.
        const { data: exercises, error: exError } = await supabase
          .from('routine_template_exercises')
          .select('*')
          .eq('template_day_id', day.id)
          .order('order_index', { ascending: true })
        if (exError) throw exError

        const { data: logs, error: logsError } = await supabase
          .from('exercise_logs')
          .select('*')
          .eq('session_id', (session as WorkoutSession).id)
        if (logsError) throw logsError

        const logsByExercise = new Map<string, ExerciseLog>(
          (logs ?? []).map((l) => [l.template_exercise_id, l as ExerciseLog])
        )

        const todayExercises: TodayExercise[] = (exercises ?? []).map(
          (ex) =>
            ({
              ...(ex as RoutineTemplateExercise),
              log: logsByExercise.get(ex.id) ?? null,
            }) satisfies TodayExercise
        )

        setWorkout({
          assignedRoutine,
          template: template as RoutineTemplate,
          day,
          session: session as WorkoutSession,
          exercises: todayExercises,
        })
      }

      // 5. Racha: días consecutivos hacia atrás con sesión completada.
      const { data: completedSessions } = await supabase
        .from('workout_sessions')
        .select('session_date, completed_at')
        .eq('athlete_id', profile.id)
        .not('completed_at', 'is', null)
        .order('session_date', { ascending: false })
        .limit(60)

      setStreak(computeStreak((completedSessions ?? []).map((s) => s.session_date)))

      // 6. Volumen y actividad de la semana en curso (lunes a domingo).
      const { monday, sunday } = currentWeekRange()
      const { data: weekSessions } = await supabase
        .from('workout_sessions')
        .select('session_date, completed_at, total_volume_kg')
        .eq('athlete_id', profile.id)
        .gte('session_date', monday)
        .lte('session_date', sunday)

      setWeeklyVolumeKg(
        (weekSessions ?? []).reduce((sum, s) => sum + Number(s.total_volume_kg ?? 0), 0)
      )
      setWeekActivity(buildWeekActivity(monday, weekSessions ?? []))
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'No se pudo cargar la rutina de hoy.')
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    load()
  }, [load])

  const toggleExercise = useCallback(
    async (exercise: TodayExercise) => {
      if (!workout) return
      const nextCompleted = !(exercise.log?.completed ?? false)

      const { data: updatedLog, error: upsertError } = await supabase
        .from('exercise_logs')
        .upsert(
          {
            session_id: workout.session.id,
            template_exercise_id: exercise.id,
            completed: nextCompleted,
            actual_weight_kg: exercise.suggested_weight_kg,
            actual_reps: Math.round(averageReps(exercise.reps_min, exercise.reps_max)),
            completed_at: nextCompleted ? new Date().toISOString() : null,
          },
          { onConflict: 'session_id,template_exercise_id' }
        )
        .select('*')
        .single()

      if (upsertError) {
        console.error(upsertError)
        return
      }

      const updatedExercises = workout.exercises.map((e) =>
        e.id === exercise.id ? { ...e, log: updatedLog as ExerciseLog } : e
      )

      // Recalcular volumen total de la sesión con los ejercicios ya completados.
      const totalVolume = updatedExercises.reduce((sum, e) => {
        if (!e.log?.completed) return sum
        const weight = Number(e.log.actual_weight_kg ?? e.suggested_weight_kg ?? 0)
        const reps = e.log.actual_reps ?? averageReps(e.reps_min, e.reps_max)
        return sum + weight * e.sets * reps
      }, 0)

      await supabase
        .from('workout_sessions')
        .update({ total_volume_kg: totalVolume })
        .eq('id', workout.session.id)

      setWorkout({
        ...workout,
        exercises: updatedExercises,
        session: { ...workout.session, total_volume_kg: totalVolume },
      })
    },
    [workout]
  )

  const finishWorkout = useCallback(async () => {
    if (!workout) return
    const { error: updateError } = await supabase
      .from('workout_sessions')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', workout.session.id)

    if (updateError) {
      console.error(updateError)
      return
    }

    setWorkout({
      ...workout,
      session: { ...workout.session, completed_at: new Date().toISOString() },
    })
    await load()
  }, [workout, load])

  const progressPercent = workout
    ? Math.round(
        (workout.exercises.filter((e) => e.log?.completed).length /
          Math.max(workout.exercises.length, 1)) *
          100
      )
    : 0

  return {
    loading,
    error,
    workout,
    isRestDay,
    progressPercent,
    streak,
    weeklyVolumeKg,
    weekActivity,
    toggleExercise,
    finishWorkout,
    refetch: load,
  }
}

function computeStreak(sessionDatesDesc: string[]): number {
  if (sessionDatesDesc.length === 0) return 0

  const dates = new Set(sessionDatesDesc)
  let streak = 0
  const cursor = new Date()

  // Si hoy todavía no se completó nada, la racha se cuenta desde ayer.
  if (!dates.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1)
  }

  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function buildWeekActivity(
  mondayISO: string,
  sessions: { session_date: string; completed_at: string | null }[]
): DayActivity[] {
  const todayISO = todayISODate()
  const sessionsByDate = new Map(sessions.map((s) => [s.session_date, s]))
  const monday = new Date(`${mondayISO}T00:00:00`)

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    const iso = date.toISOString().slice(0, 10)
    const session = sessionsByDate.get(iso)
    return {
      label: DAY_LABELS[i],
      date: iso,
      isToday: iso === todayISO,
      hasSession: Boolean(session),
      completed: Boolean(session?.completed_at),
    }
  })
}

function currentWeekRange() {
  const now = new Date()
  const dow = isoDayOfWeek(now) // 1=lunes .. 7=domingo
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dow - 1))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    monday: monday.toISOString().slice(0, 10),
    sunday: sunday.toISOString().slice(0, 10),
  }
}
