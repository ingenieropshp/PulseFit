import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import type { RoutineTemplate } from '../types/models'

export interface TemplateSummary extends RoutineTemplate {
  activeAthleteCount: number
}

export function useCoachTemplates() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<TemplateSummary[]>([])

  const load = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    setError(null)

    try {
      const { data, error: templatesError } = await supabase
        .from('routine_templates')
        .select('*')
        .eq('coach_id', profile.id)
        .order('created_at', { ascending: false })

      if (templatesError) throw templatesError

      const summaries: TemplateSummary[] = await Promise.all(
        (data ?? []).map(async (template) => {
          const { count } = await supabase
            .from('assigned_routines')
            .select('*', { count: 'exact', head: true })
            .eq('template_id', template.id)
            .eq('status', 'active')

          return { ...template, activeAthleteCount: count ?? 0 }
        })
      )

      setTemplates(summaries)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las rutinas base.')
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    load()
  }, [load])

  return { loading, error, templates, refetch: load }
}
