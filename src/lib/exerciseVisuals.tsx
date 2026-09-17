import type { LucideIcon } from 'lucide-react'
import { Anchor, Dumbbell, Footprints, Timer, Zap } from 'lucide-react'

export type ExerciseCategory = 'piernas' | 'empuje' | 'traccion' | 'core' | 'cardio'

export interface CategoryVisual {
  category: ExerciseCategory
  icon: LucideIcon
  label: string
  colorClass: string
}

const CATEGORY_VISUALS: Record<ExerciseCategory, CategoryVisual> = {
  piernas: { category: 'piernas', icon: Footprints, label: 'Piernas', colorClass: 'text-orange-400' },
  empuje: { category: 'empuje', icon: Dumbbell, label: 'Empuje', colorClass: 'text-pulse-lime' },
  traccion: { category: 'traccion', icon: Anchor, label: 'Tracción', colorClass: 'text-sky-400' },
  core: { category: 'core', icon: Timer, label: 'Core', colorClass: 'text-purple-400' },
  cardio: { category: 'cardio', icon: Zap, label: 'Cardio', colorClass: 'text-yellow-400' },
}

// El orden importa: primero las categorías más específicas (core, piernas),
// luego tracción/empuje (que comparten palabras con partes del cuerpo), y
// cardio al final. La primera coincidencia gana.
const KEYWORD_RULES: { category: ExerciseCategory; keywords: string[] }[] = [
  {
    category: 'core',
    keywords: [
      'plancha',
      'abdomina',
      'crunch',
      'russian twist',
      'elevacion de piernas',
      'rueda abdominal',
      'ab wheel',
      'pallof',
      'dead bug',
      'hollow',
      'oblicuo',
    ],
  },
  {
    category: 'piernas',
    keywords: [
      'sentadilla',
      'squat',
      'zancada',
      'lunge',
      'peso muerto',
      'deadlift',
      'prensa',
      'hip thrust',
      'puente de gluteo',
      'gluteo',
      'cuadriceps',
      'femoral',
      'isquios',
      'pantorrilla',
      'gemelo',
      'talon',
      'elevacion de talones',
      'aductor',
      'abductor',
      'step up',
      'escalon',
      'bulgara',
    ],
  },
  {
    category: 'traccion',
    keywords: [
      'remo',
      'row',
      'dominada',
      'jalon',
      'pull up',
      'pull-up',
      'pulldown',
      'curl de biceps',
      'biceps',
      'face pull',
      'encogimiento',
      'trapecio',
      'espalda',
      'pull over',
      'pullover',
    ],
  },
  {
    category: 'empuje',
    keywords: [
      'press de banca',
      'bench press',
      'press militar',
      'press de hombro',
      'press inclinado',
      'press plano',
      'fondos',
      'dip',
      'flexion',
      'push up',
      'push-up',
      'elevacion lateral',
      'apertura',
      'triceps',
      'extension de triceps',
      'pecho',
      'hombro',
    ],
  },
  {
    category: 'cardio',
    keywords: [
      'burpee',
      'mountain climber',
      'correr',
      'caminadora',
      'cinta',
      'salto',
      'jumping jack',
      'sprint',
      'bicicleta',
      'remo ergometro',
      'escaladora',
    ],
  },
]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function categorizeExercise(name: string): ExerciseCategory {
  const normalized = normalize(name)
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => normalized.includes(normalize(kw)))) {
      return rule.category
    }
  }
  // Por defecto se asume un ejercicio de empuje (el más común si no matchea).
  return 'empuje'
}

export function getExerciseVisual(name: string): CategoryVisual {
  return CATEGORY_VISUALS[categorizeExercise(name)]
}
