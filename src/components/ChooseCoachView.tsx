import { useState } from 'react'
import { Dumbbell, LogOut, ClipboardList } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAvailableCoaches, type CoachOption } from '../hooks/useAvailableCoaches'
import { supabase } from '../lib/supabaseClient'

/**
 * Pantalla que ve un atleta que todavía no tiene entrenador asignado
 * (profiles.coach_id es null). Le muestra los entrenadores disponibles con
 * las rutinas que cada uno ofrece, para que elija con quién quiere hacer su
 * proceso.
 */
export function ChooseCoachView() {
  const { profile, signOut, refreshProfile } = useAuth()
  const { loading, error, coaches } = useAvailableCoaches()
  const [choosingId, setChoosingId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleChoose(coach: CoachOption) {
    if (!profile) return
    setChoosingId(coach.id)
    setSaveError(null)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ coach_id: coach.id })
      .eq('id', profile.id)

    if (updateError) {
      setSaveError(updateError.message)
      setChoosingId(null)
      return
    }

    await refreshProfile()
    // No hace falta limpiar choosingId: al refrescar el perfil, este
    // componente deja de renderizarse (el atleta ya tiene coach_id).
  }

  return (
    <div className="flex justify-center bg-black min-h-screen font-sans text-white">
      <div className="w-full max-w-[430px] min-h-screen bg-pulse-bg flex flex-col">
        <header className="px-5 pt-6 pb-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-pulse-surface border border-pulse-lime flex items-center justify-center text-pulse-lime shrink-0">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
                <path d="M7 2v11h3v9l7-12h-4l4-8z" />
              </svg>
            </div>
            <span className="font-display font-extrabold tracking-wider text-sm">
              PULSE<span className="text-pulse-lime">FIT</span>
            </span>
          </div>
          <button
            onClick={signOut}
            className="p-2 rounded-full bg-pulse-surface text-pulse-muted hover:text-pulse-alert"
            aria-label="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </header>

        <div className="px-5 pb-3 shrink-0">
          <h1 className="text-xl font-extrabold text-white">Elige tu entrenador</h1>
          <p className="text-xs text-pulse-muted mt-1">
            Compara las rutinas que ofrece cada entrenador y elige con quién quieres hacer tu
            proceso. Podrás verlo, pero no cambiarlo tú mismo después — si necesitas cambiar de
            entrenador más adelante, pídeselo al gimnasio.
          </p>
        </div>

        <main className="flex-1 overflow-y-auto px-5 pb-6 space-y-3">
          {loading && <p className="text-center text-pulse-muted py-10 text-sm">Cargando entrenadores…</p>}

          {!loading && error && <p className="text-center text-pulse-alert py-10 text-sm">{error}</p>}

          {!loading && !error && coaches.length === 0 && (
            <div className="p-6 rounded-2xl bg-pulse-surface border border-pulse-border text-center">
              <p className="font-bold text-white">Todavía no hay entrenadores disponibles</p>
              <p className="text-xs text-pulse-muted mt-1">
                Vuelve a intentarlo en un momento, o pregunta en recepción.
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            coaches.map((coach) => (
              <div
                key={coach.id}
                className="rounded-2xl bg-pulse-surface border border-pulse-border p-4 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-pulse-card flex items-center justify-center text-pulse-lime font-black shrink-0">
                    {coach.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-white truncate">{coach.full_name}</h2>
                    <p className="text-[11px] text-pulse-muted">
                      {coach.templates.length} rutina{coach.templates.length === 1 ? '' : 's'} disponible
                      {coach.templates.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                {coach.templates.length > 0 && (
                  <div className="space-y-1.5">
                    {coach.templates.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-2.5 p-2 rounded-lg bg-pulse-card"
                      >
                        <div className="w-7 h-7 rounded-md bg-pulse-surface flex items-center justify-center text-pulse-lime shrink-0">
                          <ClipboardList size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-white truncate">{t.name}</p>
                          <p className="text-[10px] text-pulse-muted">
                            {t.days_per_week} días/semana{t.level ? ` • ${t.level}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleChoose(coach)}
                  disabled={choosingId === coach.id}
                  className="w-full py-2.5 rounded-xl bg-pulse-lime hover:bg-pulse-lime-hover text-black font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {choosingId === coach.id ? (
                    'Confirmando…'
                  ) : (
                    <>
                      <Dumbbell size={14} /> Elegir a {coach.full_name.split(' ')[0]}
                    </>
                  )}
                </button>
              </div>
            ))}

          {saveError && (
            <p className="text-center text-pulse-alert text-xs">{saveError}</p>
          )}
        </main>
      </div>
    </div>
  )
}
