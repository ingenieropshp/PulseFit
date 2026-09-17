import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { RoutineTemplate } from '../types/models'

export interface CoachOption {
  id: string
  full_name: string
  avatar_url: string | null
  level: string | null
  goal: string | null
  templates: RoutineTemplate[]
}

interface UseAvailableCoachesResult {
  loading: boolean
  error: string | null
  coaches: CoachOption[]
  refetch: () => Promise<void>
}

/**
 * Trae la lista de entrenadores disponibles (perfiles con role='coach') junto
 * con las rutinas base que cada uno ha creado, para que un atleta sin coach
 * asignado pueda comparar y elegir con quién quiere entrenar.
 */
export function useAvailableCoaches(): UseAvailableCoachesResult {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [coaches, setCoaches] = useState<CoachOption[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: coachRows, error: coachError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, level, goal')
        .eq('role', 'coach')
        .order('full_name', { ascending: true })
      if (coachError) throw coachError

      const coachIds = (coachRows ?? []).map((c) => c.id)

      let templatesByCoach = new Map<string, RoutineTemplate[]>()
      if (coachIds.length > 0) {
        const { data: templateRows, error: templatesError } = await supabase
          .from('routine_templates')
          .select('*')
          .in('coach_id', coachIds)
          .order('created_at', { ascending: false })
        if (templatesError) throw templatesError

        templatesByCoach = new Map()
        for (const t of templateRows ?? []) {
          const list = templatesByCoach.get(t.coach_id) ?? []
          list.push(t as RoutineTemplate)
          templatesByCoach.set(t.coach_id, list)
        }
      }

      const options: CoachOption[] = (coachRows ?? []).map((c) => ({
        id: c.id,
        full_name: c.full_name,
        avatar_url: c.avatar_url,
        level: c.level,
        goal: c.goal,
        templates: templatesByCoach.get(c.id) ?? [],
      }))

      setCoaches(options)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los entrenadores disponibles.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { loading, error, coaches, refetch: load }
}
