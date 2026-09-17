import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import type { AthleteSummary } from '../types/models'

function isoDayOfWeek(date = new Date()): number {
  const jsDay = date.getDay()
  return jsDay === 0 ? 7 : jsDay
}

function currentWeekRange() {
  const now = new Date()
  const dow = isoDayOfWeek(now)
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dow - 1))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    monday: monday.toISOString().slice(0, 10),
    sunday: sunday.toISOString().slice(0, 10),
  }
}

interface UseCoachAthletesResult {
  loading: boolean
  error: string | null
  athletes: AthleteSummary[]
  refetch: () => Promise<void>
}

export function useCoachAthletes(): UseCoachAthletesResult {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [athletes, setAthletes] = useState<AthleteSummary[]>([])

  const load = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    setError(null)

    try {
      const { data: athleteProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('coach_id', profile.id)
        .order('full_name', { ascending: true })

      if (profilesError) throw profilesError
      const { monday, sunday } = currentWeekRange()

      const summaries: AthleteSummary[] = await Promise.all(
        (athleteProfiles ?? []).map(async (athlete) => {
          const { data: activeRoutines } = await supabase
            .from('assigned_routines')
            .select('*')
            .eq('athlete_id', athlete.id)
            .eq('status', 'active')
            .order('start_date', { ascending: false })
            .limit(1)

          const activeRoutine = activeRoutines?.[0] ?? null

          let sessionsPlannedThisWeek = 0
          if (activeRoutine) {
            const { count } = await supabase
              .from('routine_template_days')
              .select('*', { count: 'exact', head: true })
              .eq('template_id', activeRoutine.template_id)
            sessionsPlannedThisWeek = count ?? 0
          }

          const { data: weekSessions } = await supabase
            .from('workout_sessions')
            .select('completed_at, session_date, created_at')
            .eq('athlete_id', athlete.id)
            .gte('session_date', monday)
            .lte('session_date', sunday)

          const sessionsThisWeek = (weekSessions ?? []).filter((s) => s.completed_at).length
          const weeklyCompletionPercent = sessionsPlannedThisWeek
            ? Math.min(100, Math.round((sessionsThisWeek / sessionsPlannedThisWeek) * 100))
            : 0

          const lastSessionAt =
            (weekSessions ?? [])
              .map((s) => s.completed_at)
              .filter((v): v is string => Boolean(v))
              .sort()
              .at(-1) ?? null

          let status: AthleteSummary['status'] = 'inactive'
          if (activeRoutine) {
            status = weeklyCompletionPercent >= 70 ? 'up-to-date' : 'requires-adjustment'
          }

          return {
            ...athlete,
            activeRoutine,
            weeklyCompletionPercent,
            sessionsThisWeek,
            sessionsPlannedThisWeek,
            lastSessionAt,
            status,
          } as AthleteSummary
        })
      )

      setAthletes(summaries)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los atletas.')
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    load()
  }, [load])

  return { loading, error, athletes, refetch: load }
}
