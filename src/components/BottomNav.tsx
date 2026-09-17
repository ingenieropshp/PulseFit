// BottomNav: barra de navegación inferior del panel del atleta.
// Nota de diseño: en vez de usar rutas separadas (/dashboard/progreso, /dashboard/perfil),
// este componente es "controlado" — recibe la pestaña activa y un callback para cambiarla.
// Esto evita duplicar la carga de datos (useTodayWorkout) en varias pantallas y mantiene
// toda la lógica del dashboard del atleta en un solo lugar (ClientDashboard.tsx).
import { Dumbbell, TrendingUp, User } from 'lucide-react'

export type ClientTab = 'routine' | 'progress' | 'profile'

interface BottomNavProps {
  active: ClientTab
  onChange: (tab: ClientTab) => void
}

const items: { tab: ClientTab; label: string; icon: typeof Dumbbell }[] = [
  { tab: 'routine', label: 'Rutina', icon: Dumbbell },
  { tab: 'progress', label: 'Progreso', icon: TrendingUp },
  { tab: 'profile', label: 'Perfil', icon: User },
]

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="h-16 bg-pulse-surface/90 border-t border-pulse-border flex items-center justify-around px-4 shrink-0">
      {items.map(({ tab, label, icon: Icon }) => {
        const isActive = active === tab
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive ? 'text-pulse-lime' : 'text-pulse-muted hover:text-white'
            }`}
          >
            <Icon size={18} />
            <span className="text-[9px] font-extrabold uppercase tracking-wide">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
