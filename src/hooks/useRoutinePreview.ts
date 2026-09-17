import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import type { RoutineTemplate, RoutineTemplateDay, RoutineTemplateExercise } from '../types/models'

const todayISODate = () => new Date().toISOString().slice(0, 10)

/** Lunes=1 ... Domingo=7, igual que day_of_week en la BD. */
function isoDayOfWeek(date = new Date()): number {
  const jsDay = date.getDay() // 0=domingo..6=sábado
  return jsDay === 0 ? 7 : jsDay
}

export interface RoutineDayPreview extends RoutineTemplateDay {
  isToday: boolean
  exercises: RoutineTemplateExercise[]
}

interface UseRoutinePreviewResult {
  loading: boolean
  error: string | null
  template: RoutineTemplate | null
  days: RoutineDayPreview[]
  refetch: () => Promise<void>
}

/**
 * Trae TODOS los días y ejercicios de la rutina activa del atleta (no solo
 * el de hoy), para la vista previa "ejemplo de cada sesión".
 */
export function useRoutinePreview(): UseRoutinePreviewResult {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [template, setTemplate] = useState<RoutineTemplate | null>(null)
  const [days, setDays] = useState<RoutineDayPreview[]>([])

  const load = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    setError(null)

    try {
      const { data: assignedRoutines, error: arError } = await supabase
        .from('assigned_routines')
        .select('*')
        .eq('athlete_id', profile.id)
        .eq('status', 'active')
        .lte('start_date', todayISODate())
        .order('start_date', { ascending: false })
        .limit(1)
      if (arError) throw arError

      const assignedRoutine = assignedRoutines?.[0] ?? null
      if (!assignedRoutine) {
        setTemplate(null)
        setDays([])
        return
      }

      const { data: templateRow, error: templateError } = await supabase
        .from('routine_templates')
        .select('*')
        .eq('id', assignedRoutine.template_id)
        .single()
      if (templateError) throw templateError

      const { data: dayRows, error: daysError } = await supabase
        .from('routine_template_days')
        .select('*')
        .eq('template_id', assignedRoutine.template_id)
        .order('order_index', { ascending: true })
      if (daysError) throw daysError

      const dayIds = (dayRows ?? []).map((d) => d.id)
      const exercisesByDay = new Map<string, RoutineTemplateExercise[]>()

      if (dayIds.length > 0) {
        const { data: exerciseRows, error: exError } = await supabase
          .from('routine_template_exercises')
          .select('*')
          .in('template_day_id', dayIds)
          .order('order_index', { ascending: true })
        if (exError) throw exError

        for (const ex of exerciseRows ?? []) {
          const list = exercisesByDay.get(ex.template_day_id) ?? []
          list.push(ex as RoutineTemplateExercise)
          exercisesByDay.set(ex.template_day_id, list)
        }
      }

      const todayDow = isoDayOfWeek()
      const previewDays: RoutineDayPreview[] = (dayRows ?? []).map((day) => ({
        ...(day as RoutineTemplateDay),
        isToday: day.day_of_week === todayDow,
        exercises: exercisesByDay.get(day.id) ?? [],
      }))

      setTemplate(templateRow as RoutineTemplate)
      setDays(previewDays)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'No se pudo cargar la vista previa de la rutina.')
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    load()
  }, [load])

  return { loading, error, template, days, refetch: load }
}
