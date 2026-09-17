import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { getExerciseVisual } from '../lib/exerciseVisuals'
import type { RoutineDayPreview } from '../hooks/useRoutinePreview'

interface RoutinePreviewListProps {
  days: RoutineDayPreview[]
}

/** Acordeón con un ejemplo de cada sesión (día) de la rutina asignada. */
export function RoutinePreviewList({ days }: RoutinePreviewListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    days.find((d) => d.isToday)?.id ?? days[0]?.id ?? null
  )

  if (days.length === 0) {
    return (
      <p className="text-center text-pulse-muted text-xs py-6">
        Esta rutina todavía no tiene días configurados.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {days.map((day) => {
        const isExpanded = expandedId === day.id
        const DayIcon = getExerciseVisual(day.exercises[0]?.name ?? '').icon

        return (
          <div
            key={day.id}
            className={`rounded-xl border overflow-hidden transition-colors ${
              day.isToday ? 'border-pulse-lime/60 bg-pulse-lime/5' : 'border-pulse-border bg-pulse-surface'
            }`}
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : day.id)}
              className="w-full flex items-center justify-between p-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-pulse-card flex items-center justify-center shrink-0 text-pulse-muted">
                  <DayIcon size={16} />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                    {day.label}
                    {day.isToday && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-pulse-lime text-black rounded shrink-0">
                        Hoy
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-pulse-muted mt-0.5">
                    {day.exercises.length} ejercicio{day.exercises.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              <ChevronDown
                size={18}
                className={`text-pulse-muted shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {isExpanded && (
              <div className="px-3 pb-3 space-y-1.5">
                {day.exercises.length === 0 && (
                  <p className="text-[11px] text-pulse-muted py-2">Sin ejercicios configurados.</p>
                )}
                {day.exercises.map((exercise) => {
                  const visual = getExerciseVisual(exercise.name)
                  const Icon = visual.icon
                  return (
                    <div key={exercise.id} className="p-2 rounded-lg bg-pulse-card flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-md bg-pulse-surface flex items-center justify-center shrink-0 ${visual.colorClass}`}
                      >
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-white leading-tight truncate">
                          {exercise.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-pulse-muted">
                          <span>
                            {exercise.sets} × {exercise.reps_min}-{exercise.reps_max}
                          </span>
                          <span>• {exercise.rest_seconds}s</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
