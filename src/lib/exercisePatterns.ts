// Detecta el "patrón de movimiento" de un ejercicio a partir de su nombre,
// para decidir qué animación de muñeco (StickFigure) mostrarle al atleta
// como ejemplo. Es una aproximación por palabras clave, no una clasificación
// biomecánica exacta — el objetivo es dar una referencia visual rápida.
export type MovementPattern =
  | 'squat'
  | 'hinge'
  | 'push-horizontal'
  | 'push-vertical'
  | 'pull-row'
  | 'arm-isolation'
  | 'core'
  | 'calf'
  | 'cardio'

// El orden importa: la primera coincidencia gana, así que las reglas más
// específicas van primero (p. ej. "peso muerto" antes que caiga en "sentadilla").
const PATTERN_RULES: { pattern: MovementPattern; keywords: string[] }[] = [
  {
    pattern: 'calf',
    keywords: ['pantorrilla', 'gemelo', 'talon'],
  },
  {
    pattern: 'core',
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
    pattern: 'hinge',
    keywords: ['peso muerto', 'deadlift', 'hip thrust', 'puente de gluteo', 'buenos dias', 'good morning'],
  },
  {
    pattern: 'squat',
    keywords: [
      'sentadilla',
      'squat',
      'zancada',
      'lunge',
      'prensa',
      'cuadriceps',
      'femoral',
      'isquios',
      'aductor',
      'abductor',
      'step up',
      'escalon',
      'bulgara',
      'gluteo',
    ],
  },
  {
    pattern: 'pull-row',
    keywords: [
      'remo',
      'row',
      'dominada',
      'jalon',
      'pull up',
      'pull-up',
      'pulldown',
      'face pull',
      'encogimiento',
      'trapecio',
      'pull over',
      'pullover',
      'espalda',
    ],
  },
  {
    pattern: 'arm-isolation',
    keywords: ['curl de biceps', 'biceps', 'triceps', 'extension de triceps', 'patada de triceps'],
  },
  {
    pattern: 'push-vertical',
    keywords: ['press militar', 'press de hombro', 'elevacion lateral', 'elevacion frontal', 'apertura de hombro', 'hombro'],
  },
  {
    pattern: 'push-horizontal',
    keywords: [
      'press de banca',
      'bench press',
      'press inclinado',
      'press plano',
      'fondos',
      'dip',
      'flexion',
      'push up',
      'push-up',
      'apertura',
      'pecho',
    ],
  },
  {
    pattern: 'cardio',
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

export function detectMovementPattern(name: string): MovementPattern {
  const normalized = normalize(name)
  for (const rule of PATTERN_RULES) {
    if (rule.keywords.some((kw) => normalized.includes(normalize(kw)))) {
      return rule.pattern
    }
  }
  return 'push-horizontal'
}
