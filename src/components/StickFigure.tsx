import type { MovementPattern } from '../lib/exercisePatterns'

interface StickFigureProps {
  pattern: MovementPattern
  size?: number
  className?: string
}

// Qué parte del muñeco se anima (y con qué clase CSS, definida en index.css)
// según el patrón de movimiento detectado para el ejercicio.
const ANIMATION_CLASSES: Record<
  MovementPattern,
  {
    legs?: string
    torso?: string
    arms?: string
    whole?: string
    legLeft?: string
    legRight?: string
  }
> = {
  squat: { legs: 'figure-anim-squat-legs', torso: 'figure-anim-squat-torso' },
  hinge: { torso: 'figure-anim-hinge-torso' },
  'push-horizontal': { arms: 'figure-anim-push-h-arms' },
  'push-vertical': { arms: 'figure-anim-push-v-arms' },
  'pull-row': { arms: 'figure-anim-pull-arms' },
  'arm-isolation': { arms: 'figure-anim-curl-arms' },
  core: { whole: 'figure-anim-core-pulse' },
  calf: { whole: 'figure-anim-calf-whole' },
  cardio: { legLeft: 'figure-anim-cardio-leg-left', legRight: 'figure-anim-cardio-leg-right' },
}

/**
 * Muñeco de palitos (stick figure) animado que ilustra, de forma
 * simplificada, el patrón de movimiento de un ejercicio (sentadilla,
 * empuje, tracción, etc.). No es una demostración técnica precisa: es una
 * referencia visual rápida para que el atleta entienda qué tipo de
 * movimiento le espera en cada ejercicio.
 */
export function StickFigure({ pattern, size = 40, className = '' }: StickFigureProps) {
  const anim = ANIMATION_CLASSES[pattern]

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`${anim.whole ?? ''} ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {/* Piernas (comparten pivote en la cadera) */}
      <g style={{ transformOrigin: '32px 40px' }} className={anim.legs}>
        <line
          x1="32"
          y1="40"
          x2="24"
          y2="60"
          className={anim.legLeft}
          style={{ transformOrigin: '32px 40px' }}
        />
        <line
          x1="32"
          y1="40"
          x2="40"
          y2="60"
          className={anim.legRight}
          style={{ transformOrigin: '32px 40px' }}
        />
      </g>

      {/* Torso + cabeza + brazos (los brazos heredan la rotación del torso) */}
      <g style={{ transformOrigin: '32px 40px' }} className={anim.torso}>
        <line x1="32" y1="40" x2="32" y2="18" />
        <circle cx="32" cy="11" r="6" fill="currentColor" stroke="none" />

        {/* Brazo izquierdo */}
        <g className={anim.arms} style={{ transformOrigin: '32px 20px' }}>
          <line x1="32" y1="20" x2="18" y2="30" />
        </g>

        {/* Brazo derecho: es un espejo del izquierdo (mismas coordenadas
            locales dentro de un contenedor con scaleX(-1)) para que ambos
            brazos se muevan de forma simétrica en vez de rotar juntos como
            un bloque rígido. */}
        <g style={{ transformOrigin: '32px 20px', transform: 'scaleX(-1)' }}>
          <g className={anim.arms} style={{ transformOrigin: '32px 20px' }}>
            <line x1="32" y1="20" x2="18" y2="30" />
          </g>
        </g>
      </g>
    </svg>
  )
}
