import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Gauge, MessageSquare, Bell } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useCoachTemplates } from '../hooks/useCoachTemplates'
import type { Profile } from '../types/models'

const DURATIONS = [4, 8, 12] as const
const MAX_NOTES = 240

function nextMonday(): string {
  const d = new Date()
  const day = d.getDay() // 0=domingo
  const diff = day === 1 ? 7 : ((8 - day) % 7 || 7)
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

export function AssignRoutine() {
  const { athleteId } = useParams<{ athleteId: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { templates, loading: loadingTemplates } = useCoachTemplates()

  const [athlete, setAthlete] = useState<Profile | null>(null)
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(nextMonday())
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>(4)
  const [rpe, setRpe] = useState(8)
  const [notes, setNotes] = useState('')
  const [pushNotification, setPushNotification] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!athleteId) return
    supabase
      .from('profiles')
      .select('*')
      .eq('id', athleteId)
      .single()
      .then(({ data }) => setAthlete(data as Profile))
  }, [athleteId])

  useEffect(() => {
    if (!templateId && templates.length > 0) {
      setTemplateId(templates[0].id)
    }
  }, [templates, templateId])

  const rpeLabel = useMemo(() => {
    if (rpe <= 6.5) return `RPE ${rpe} (Técnica & Descarga)`
    if (rpe <= 8.5) return `RPE ${rpe} (Sobrecarga Óptima)`
    return `RPE ${rpe} (Fallo Absoluto)`
  }, [rpe])

  async function handleSubmit() {
    if (!profile || !athleteId || !templateId) {
      setError('Selecciona un programa base antes de continuar.')
      return
    }
    setSaving(true)
    setError(null)

    // Solo una rutina activa a la vez por atleta.
    await supabase
      .from('assigned_routines')
      .update({ status: 'completed' })
      .eq('athlete_id', athleteId)
      .eq('status', 'active')

    const { error: insertError } = await supabase.from('assigned_routines').insert({
      athlete_id: athleteId,
      coach_id: profile.id,
      template_id: templateId,
      start_date: startDate,
      duration_weeks: duration,
      target_rpe: rpe,
      coach_notes: notes.trim() || null,
      push_notification: pushNotification,
      status: 'active',
    })

    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="flex justify-center bg-black min-h-screen font-sans text-white items-center p-6">
        <div className="bg-pulse-surface border border-pulse-border rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-pulse-lime/15 text-pulse-lime flex items-center justify-center">
            <Gauge size={28} />
          </div>
          <h3 className="text-lg font-bold">¡Rutina Asignada!</h3>
          <p className="text-sm text-pulse-muted">
            {athlete?.full_name ?? 'El atleta'} ya puede ver su nuevo programa en su panel.
          </p>
          <button
            onClick={() => navigate('/coach')}
            className="w-full py-3 rounded-full bg-pulse-lime text-black font-bold text-sm"
          >
            Volver al Panel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center bg-black min-h-screen font-sans text-white">
      <div className="w-full max-w-[430px] min-h-screen bg-pulse-bg flex flex-col px-margin-mobile py-space-lg gap-space-md">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-pulse-muted hover:text-white text-xs font-semibold uppercase tracking-wider w-fit"
        >
          <ArrowLeft size={16} /> Volver al Panel
        </button>

        <div>
          <h1 className="text-xl font-display font-bold">Asignar Rutina Personalizada</h1>
          <p className="text-xs text-pulse-muted mt-1">
            Configura el microciclo de entrenamiento para {athlete?.full_name ?? 'tu atleta'}.
          </p>
        </div>

        {athlete && (
          <div className="rounded-xl bg-pulse-surface p-4 flex items-center gap-3 border border-pulse-border">
            <div className="w-12 h-12 rounded-full bg-pulse-card flex items-center justify-center text-pulse-lime font-bold">
              {athlete.full_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm truncate">{athlete.full_name}</h2>
              <p className="text-xs text-pulse-muted truncate">
                {athlete.goal ?? 'Sin objetivo definido'} {athlete.level ? `• ${athlete.level}` : ''}
              </p>
            </div>
          </div>
        )}

        {/* Selección de programa base */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">Seleccionar Programa Base</h3>
          <span className="text-xs text-pulse-muted">{templates.length} disponibles</span>
        </div>

        <div className="flex flex-col gap-2">
          {loadingTemplates && <p className="text-xs text-pulse-muted">Cargando plantillas…</p>}
          {!loadingTemplates && templates.length === 0 && (
            <p className="text-xs text-pulse-muted bg-pulse-surface rounded-xl p-4 border border-dashed border-pulse-border">
              Todavía no tienes rutinas base. Crea una desde el Panel de Entrenador antes de asignar.
            </p>
          )}
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplateId(t.id)}
              className={`text-left rounded-xl p-4 border transition-all ${
                templateId === t.id
                  ? 'bg-pulse-card border-pulse-lime ring-1 ring-pulse-lime/40'
                  : 'bg-pulse-surface border-pulse-border hover:border-pulse-border-strong'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm">{t.name}</h4>
                  <p className="text-xs text-pulse-muted mt-0.5">
                    {t.days_per_week} días/semana {t.level ? `• ${t.level}` : ''}
                  </p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    templateId === t.id ? 'bg-pulse-lime text-black' : 'bg-pulse-card text-pulse-muted'
                  }`}
                >
                  {templateId === t.id ? '✓' : '+'}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Parámetros de personalización */}
        <h3 className="text-sm font-bold pt-2">Parámetros de Personalización</h3>

        <div className="space-y-3 rounded-xl bg-pulse-surface p-4 border border-pulse-border">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-pulse-muted mb-1.5">
              <CalendarDays size={14} /> Fecha de Inicio Programada
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-11 px-3 rounded-lg bg-pulse-bg-alt border border-pulse-border focus:border-pulse-lime focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-pulse-muted mb-1.5">
              Duración del Macro/Mesociclo
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-pulse-bg-alt rounded-lg">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`py-2 rounded-md text-xs font-bold transition-all ${
                    duration === d ? 'bg-pulse-card text-pulse-lime shadow-sm' : 'text-pulse-muted hover:text-white'
                  }`}
                >
                  {d} semanas
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RPE */}
        <div className="rounded-xl bg-pulse-surface p-4 border border-pulse-border space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-xs font-semibold text-pulse-muted">Intensidad / RPE Objetivo</span>
              <span className="font-bold text-sm">{rpeLabel}</span>
            </div>
            <Gauge size={20} className="text-pulse-lime" />
          </div>
          <input
            type="range"
            min={6}
            max={10}
            step={0.5}
            value={rpe}
            onChange={(e) => setRpe(Number(e.target.value))}
            className="w-full accent-pulse-lime"
          />
          <div className="flex justify-between text-[10px] text-pulse-muted">
            <span>RPE 6 (Técnica)</span>
            <span>RPE 10 (Fallo Absoluto)</span>
          </div>
        </div>

        {/* Notas del coach */}
        <div className="rounded-xl bg-pulse-surface p-4 border border-pulse-border space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold">
            <MessageSquare size={14} className="text-pulse-lime" /> Notas del Entrenador
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES))}
            rows={3}
            placeholder="Instrucciones de técnica, cadencia o pautas nutricionales…"
            className="w-full p-3 rounded-lg bg-pulse-bg-alt border border-pulse-border focus:border-pulse-lime focus:outline-none text-sm resize-none"
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPushNotification((v) => !v)}
              className="flex items-center gap-2 text-xs font-semibold"
            >
              <span
                className={`w-10 h-6 rounded-full p-0.5 transition-colors flex items-center ${
                  pushNotification ? 'bg-pulse-lime' : 'bg-pulse-card'
                }`}
              >
                <span
                  className={`w-5 h-5 bg-black rounded-full transition-transform ${
                    pushNotification ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </span>
              <Bell size={14} className={pushNotification ? 'text-pulse-lime' : 'text-pulse-muted'} />
              {pushNotification ? 'Notificación activada' : 'Sin notificación'}
            </button>
            <span className="text-[10px] text-pulse-muted">
              {notes.length} / {MAX_NOTES} car.
            </span>
          </div>
        </div>

        {error && <p className="text-sm text-pulse-alert">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={saving || !templateId}
          className="w-full h-12 rounded-full bg-pulse-lime text-black font-extrabold uppercase text-sm tracking-wider shadow-lg active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {saving ? 'Asignando…' : 'Confirmar y Asignar Rutina'}
        </button>
      </div>
    </div>
  )
}
