import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, PlusCircle, Users, TrendingUp, ClipboardList, LogOut, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCoachAthletes } from '../hooks/useCoachAthletes'
import { useCoachTemplates } from '../hooks/useCoachTemplates'
import { supabase } from '../lib/supabaseClient'
import type { AthleteSummary } from '../types/models'

type FilterKey = 'all' | 'up-to-date' | 'requires-adjustment' | 'inactive'

const FILTERS: { key: FilterKey; label: (count: number) => string }[] = [
  { key: 'all', label: (n) => `Todos (${n})` },
  { key: 'up-to-date', label: (n) => `Al día (${n})` },
  { key: 'requires-adjustment', label: (n) => `Requiere ajuste (${n})` },
  { key: 'inactive', label: (n) => `Inactivos (${n})` },
]

export function CoachDashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { loading, error, athletes, refetch } = useCoachAthletes()
  const { templates } = useCoachTemplates()

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [showNewRoutineModal, setShowNewRoutineModal] = useState(false)

  const counts = useMemo(
    () => ({
      all: athletes.length,
      'up-to-date': athletes.filter((a) => a.status === 'up-to-date').length,
      'requires-adjustment': athletes.filter((a) => a.status === 'requires-adjustment').length,
      inactive: athletes.filter((a) => a.status === 'inactive').length,
    }),
    [athletes]
  )

  const filteredAthletes = useMemo(() => {
    const q = query.toLowerCase().trim()
    return athletes.filter((a) => {
      const matchesQuery = !q || a.full_name.toLowerCase().includes(q) || (a.goal ?? '').toLowerCase().includes(q)
      const matchesFilter = filter === 'all' || a.status === filter
      return matchesQuery && matchesFilter
    })
  }, [athletes, query, filter])

  return (
    <div className="flex justify-center bg-black min-h-screen font-sans text-white">
      <div className="w-full max-w-[480px] min-h-screen bg-pulse-bg flex flex-col px-margin-mobile pb-space-xl">
        {/* Header */}
        <section className="flex flex-col gap-space-md pt-space-lg">
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <h1 className="text-2xl font-display font-bold">Panel de Entrenador</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-pulse-lime/20 text-pulse-lime text-[10px] font-bold uppercase tracking-wider">
                Coach Pro
              </span>
            </div>
            <button
              onClick={signOut}
              className="w-10 h-10 rounded-full bg-pulse-surface flex items-center justify-center text-pulse-muted hover:text-pulse-alert"
              aria-label="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>

          <button
            onClick={() => setShowNewRoutineModal(true)}
            className="w-full h-12 bg-pulse-lime text-black rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform"
          >
            <PlusCircle size={18} /> Crear Nueva Rutina
          </button>
        </section>

        {/* Métricas rápidas */}
        <section className="grid grid-cols-3 gap-2 mt-space-md">
          <MetricTile icon={<Users size={16} />} label="Atletas Activos" value={String(athletes.length)} />
          <MetricTile
            icon={<TrendingUp size={16} />}
            label="Cumplimiento"
            value={`${Math.round(
              athletes.reduce((sum, a) => sum + a.weeklyCompletionPercent, 0) / Math.max(athletes.length, 1)
            )}%`}
          />
          <MetricTile
            icon={<ClipboardList size={16} />}
            label="Por revisar"
            value={String(counts['requires-adjustment'])}
          />
        </section>

        {/* Búsqueda y filtros */}
        <section className="flex flex-col gap-space-sm mt-space-md">
          <div className="relative w-full">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pulse-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar atleta por nombre u objetivo…"
              className="w-full h-11 pl-10 pr-4 bg-pulse-surface rounded-full text-white text-sm placeholder:text-pulse-muted/60 focus:outline-none focus:bg-pulse-card"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  filter === key ? 'bg-pulse-lime text-black' : 'bg-pulse-surface text-pulse-muted hover:text-white'
                }`}
              >
                {label(counts[key])}
              </button>
            ))}
          </div>
        </section>

        {/* Lista de atletas */}
        <section className="flex flex-col gap-space-sm mt-space-md">
          {loading && <p className="text-center text-pulse-muted text-sm py-8">Cargando atletas…</p>}
          {!loading && error && <p className="text-center text-pulse-alert text-sm py-8">{error}</p>}
          {!loading && !error && filteredAthletes.length === 0 && (
            <div className="py-8 flex flex-col items-center text-center bg-pulse-surface rounded-xl border border-dashed border-pulse-border">
              <p className="font-bold text-white">No se encontraron atletas</p>
              <p className="text-xs text-pulse-muted mt-1">Ajusta la búsqueda o el filtro seleccionado.</p>
            </div>
          )}
          {!loading &&
            !error &&
            filteredAthletes.map((athlete) => (
              <AthleteCard
                key={athlete.id}
                athlete={athlete}
                onAssign={() => navigate(`/coach/assign/${athlete.id}`)}
              />
            ))}
        </section>

        {/* Biblioteca de rutinas */}
        <section className="flex flex-col gap-space-sm pt-space-lg">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <ClipboardList size={18} className="text-pulse-lime" /> Biblioteca de Rutinas
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {templates.length === 0 && (
              <p className="text-xs text-pulse-muted">Aún no has creado ninguna plantilla.</p>
            )}
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex-shrink-0 w-56 bg-pulse-surface rounded-xl p-3.5 flex flex-col justify-between gap-3 border border-pulse-border"
              >
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-pulse-card text-pulse-lime">
                    <ClipboardList size={18} />
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-pulse-card text-pulse-muted">
                    {t.days_per_week} días/sem
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{t.name}</h3>
                  <p className="text-xs text-pulse-muted mt-0.5 line-clamp-2">{t.description}</p>
                </div>
                <span className="text-[10px] uppercase text-pulse-muted">
                  {t.activeAthleteCount} atletas activos
                </span>
              </div>
            ))}
          </div>
        </section>

        {showNewRoutineModal && (
          <NewRoutineModal
            coachId={profile!.id}
            onClose={() => setShowNewRoutineModal(false)}
            onCreated={() => {
              setShowNewRoutineModal(false)
              refetch()
            }}
          />
        )}
      </div>
    </div>
  )
}

function MetricTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-pulse-surface rounded-xl p-3 flex flex-col justify-between border border-pulse-border">
      <div className="text-pulse-lime">{icon}</div>
      <div className="mt-2">
        <div className="text-xl font-display font-bold tabular-nums">{value}</div>
        <div className="text-[9px] text-pulse-muted uppercase tracking-wider mt-0.5">{label}</div>
      </div>
    </div>
  )
}

function AthleteCard({ athlete, onAssign }: { athlete: AthleteSummary; onAssign: () => void }) {
  const statusStyles: Record<AthleteSummary['status'], string> = {
    'up-to-date': 'bg-pulse-emerald/15 text-pulse-emerald',
    'requires-adjustment': 'bg-pulse-alert/15 text-pulse-alert',
    inactive: 'bg-pulse-card text-pulse-muted',
  }
  const statusLabel: Record<AthleteSummary['status'], string> = {
    'up-to-date': 'Al día',
    'requires-adjustment': 'Requiere ajuste',
    inactive: 'Sin rutina activa',
  }

  return (
    <article className="bg-pulse-surface rounded-xl p-4 flex flex-col gap-3 border border-pulse-border">
      <div className="flex items-center justify-between">
        <div className="flex flex-col min-w-0">
          <h2 className="text-sm font-bold text-white truncate">{athlete.full_name}</h2>
          <span className="text-xs text-pulse-muted truncate">{athlete.goal ?? 'Sin objetivo definido'}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusStyles[athlete.status]}`}>
          {statusLabel[athlete.status]}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 bg-pulse-bg-alt rounded-lg p-3">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-pulse-muted">
          <span>Progreso Semanal</span>
          <span className="text-pulse-lime font-bold">{athlete.weeklyCompletionPercent}%</span>
        </div>
        <div className="w-full h-2 bg-pulse-card rounded-full overflow-hidden">
          <div
            className="h-full bg-pulse-lime rounded-full transition-all"
            style={{ width: `${athlete.weeklyCompletionPercent}%` }}
          />
        </div>
        <span className="text-[10px] text-pulse-muted">
          {athlete.sessionsThisWeek}/{athlete.sessionsPlannedThisWeek || '—'} sesiones esta semana
        </span>
      </div>

      <button
        onClick={onAssign}
        className="w-full h-10 rounded-full bg-pulse-lime text-black text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
      >
        Asignar Rutina
      </button>
    </article>
  )
}

function NewRoutineModal({
  coachId,
  onClose,
  onCreated,
}: {
  coachId: string
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [daysPerWeek, setDaysPerWeek] = useState(4)
  const [level, setLevel] = useState('Intermedio')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Ponle un nombre a la rutina.')
      return
    }
    setSaving(true)
    setError(null)
    const { error: insertError } = await supabase.from('routine_templates').insert({
      coach_id: coachId,
      name: name.trim(),
      description: description.trim() || null,
      days_per_week: daysPerWeek,
      level,
    })
    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    onCreated()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-pulse-surface border border-pulse-border rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-pulse-border">
          <h3 className="text-lg font-bold">Crear Nueva Rutina</h3>
          <button onClick={onClose} className="text-pulse-muted hover:text-white">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-pulse-muted mb-1.5">Nombre de la rutina</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Fuerza 5x5 Avanzada"
              className="w-full h-11 px-3.5 rounded-xl bg-pulse-bg-alt border border-pulse-border focus:border-pulse-lime focus:outline-none text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-pulse-muted mb-1.5">Días / semana</label>
              <select
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-xl bg-pulse-bg-alt border border-pulse-border focus:border-pulse-lime focus:outline-none text-sm"
              >
                {[2, 3, 4, 5, 6].map((d) => (
                  <option key={d} value={d}>
                    {d} días
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-pulse-muted mb-1.5">Nivel</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-pulse-bg-alt border border-pulse-border focus:border-pulse-lime focus:outline-none text-sm"
              >
                {['Principiante', 'Intermedio', 'Avanzado', 'Elite'].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-pulse-muted mb-1.5">Descripción (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Objetivo, enfoque, descansos recomendados…"
              className="w-full p-3 rounded-xl bg-pulse-bg-alt border border-pulse-border focus:border-pulse-lime focus:outline-none text-sm resize-none"
            />
          </div>
          {error && <p className="text-sm text-pulse-alert">{error}</p>}
          <p className="text-[11px] text-pulse-muted">
            Después de crearla podrás sumarle los días y ejercicios desde el editor de rutinas.
          </p>
          <div className="flex items-center gap-2 pt-3 mt-2 border-t border-pulse-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-full bg-pulse-card text-white text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-11 rounded-full bg-pulse-lime text-black text-sm font-bold disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar Rutina'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
