import { X } from 'lucide-react'
import { StickFigure } from './StickFigure'
import { detectMovementPattern } from '../lib/exercisePatterns'
import { getExerciseVisual } from '../lib/exerciseVisuals'

export interface DemoExercise {
  name: string
  sets: number
  reps_min: number
  reps_max: number
  rest_seconds: number
}

interface ExerciseDemoModalProps {
  exercise: DemoExercise
  onClose: () => void
}

/** Modal con el muñeco animado haciendo el ejercicio, en grande. */
export function ExerciseDemoModal({ exercise, onClose }: ExerciseDemoModalProps) {
  const pattern = detectMovementPattern(exercise.name)
  const visual = getExerciseVisual(exercise.name)

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-pulse-surface border border-pulse-border w-full max-w-sm p-5 rounded-2xl text-center space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end -mt-1 -mr-1">
          <button
            onClick={onClose}
            className="p-1.5 text-pulse-muted hover:text-white"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div
          className={`mx-auto w-32 h-32 rounded-2xl bg-pulse-card flex items-center justify-center ${visual.colorClass}`}
        >
          <StickFigure pattern={pattern} size={88} />
        </div>

        <div>
          <h3 className="text-base font-extrabold text-white">{exercise.name}</h3>
          <p className="text-xs text-pulse-muted mt-1.5">
            {exercise.sets} series × {exercise.reps_min}-{exercise.reps_max} reps · {exercise.rest_seconds}s descanso
          </p>
        </div>

        <p className="text-[10px] text-pulse-muted leading-relaxed">
          Ejemplo ilustrativo del movimiento. Ante cualquier duda de técnica, consulta a tu entrenador.
        </p>
      </div>
    </div>
  )
}
