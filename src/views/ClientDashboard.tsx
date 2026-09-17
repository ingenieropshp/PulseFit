import { useEffect, useState } from 'react'
import {
  Flame,
  Bell,
  Dumbbell,
  TrendingUp,
  Clock,
  CheckCircle2,
  Circle,
  Trophy,
  Play,
  Pause,
  RotateCcw,
  X,
  LogOut,
  ChevronDown,
  CalendarDays,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTodayWorkout } from '../hooks/useTodayWorkout'
import { useRoutinePreview } from '../hooks/useRoutinePreview'
import { BottomNav, type ClientTab } from '../components/BottomNav'
import { ChooseCoachView } from '../components/ChooseCoachView'
import { RoutinePreviewList } from '../components/RoutinePreviewList'
import { StickFigure } from '../components/StickFigure'
import { ExerciseDemoModal, type DemoExercise } from '../components/ExerciseDemoModal'
import { getExerciseVisual } from '../lib/exerciseVisuals'
import { detectMovementPattern } from '../lib/exercisePatterns'
import type { TodayExercise } from '../types/models'

const WEEKDAY_LABEL = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

export function ClientDashboard() {
  const { profile, session, signOut } = useAuth()
  const {
    loading,
    error,
    workout,
    isRestDay,
    progressPercent,
    streak,
    weeklyVolumeKg,
    weekActivity,
    toggleExercise,
    finishWorkout,
  } = useTodayWorkout()
  const { days: previewDays, loading: previewLoading } = useRoutinePreview()

  const [activeTab, setActiveTab] = useState<ClientTab>('routine')
  const [showCelebration, setShowCelebration] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(60)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [showFullRoutine, setShowFullRoutine] = useState(false)
  const [demoExercise, setDemoExercise] = useState<DemoExercise | null>(null)

  useEffect(() => {
    if (!isTimerRunning) return
    if (timerSeconds <= 0) {
      setIsTimerRunning(false)
      return
    }
    const id = setTimeout(() => setTimerSeconds((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [isTimerRunning, timerSeconds])

  async function handleToggle(exercise: TodayExercise) {
    await toggleExercise(exercise)
  }

  async function handleFinish() {
    await finishWorkout()
    setShowCelebration(true)
  }

  const todayLabel = capitalize(WEEKDAY_LABEL.format(new Date()))
  const completedCount = workout?.exercises.filter((e) => e.log?.completed).length ?? 0
  const totalCount = workout?.exercises.length ?? 0

  // Un atleta sin entrenador asignado todavía no tiene nada que ver aquí:
  // primero elige con quién va a hacer su proceso.
  if (profile && !profile.coach_id) {
    return <ChooseCoachView />
  }

  return (
    <div className="flex justify-center bg-black min-h-screen font-sans text-white">
      <div className="w-full max-w-[430px] min-h-screen bg-pulse-bg flex flex-col">
        {/* Header */}
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
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-full bg-pulse-surface text-pulse-muted hover:text-white">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-pulse-lime" />
            </button>
            <button
              onClick={signOut}
              className="p-2 rounded-full bg-pulse-surface text-pulse-muted hover:text-pulse-alert"
              aria-label="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Saludo y racha */}
        <div className="px-5 pb-2 flex items-end justify-between shrink-0">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-pulse-muted font-bold">
              {todayLabel}
            </p>
            <h1 className="text-xl font-extrabold text-white mt-0.5">
              ¡A darle, {(profile?.full_name ?? 'atleta').split(' ')[0]}! 🔥
            </h1>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-pulse-surface border border-pulse-border rounded-full text-xs font-bold text-pulse-lime">
            <Flame size={14} />
            <span>{streak} DÍAS</span>
          </div>
        </div>

        {/* Tabs (solo Rutina/Progreso; Perfil se abre desde el BottomNav) */}
        {activeTab !== 'profile' && (
          <div className="px-5 my-2 shrink-0">
            <div className="grid grid-cols-2 p-1 bg-pulse-surface rounded-xl border border-pulse-border">
              <button
                onClick={() => setActiveTab('routine')}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'routine' ? 'bg-pulse-lime text-black shadow-md' : 'text-pulse-muted hover:text-white'
                }`}
              >
                <Dumbbell size={14} /> Rutina de Hoy
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'progress' ? 'bg-pulse-lime text-black shadow-md' : 'text-pulse-muted hover:text-white'
                }`}
              >
                <TrendingUp size={14} /> Mi Progreso
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-5 pb-4 space-y-3">
          {loading && <p className="text-center text-pulse-muted py-10 text-sm">Cargando tu rutina…</p>}

          {!loading && error && (
            <p className="text-center text-pulse-alert py-10 text-sm">{error}</p>
          )}

          {!loading && !error && activeTab === 'routine' && (
            <>
              {isRestDay && (
                <div className="p-6 rounded-2xl bg-pulse-surface border border-pulse-border text-center">
                  <p className="text-2xl mb-2">😴</p>
                  <p className="font-bold text-white">Hoy es día de descanso</p>
                  <p className="text-xs text-pulse-muted mt-1">
                    Aprovecha para recuperar. Mañana seguimos con todo.
                  </p>
                </div>
              )}

              {!isRestDay && !workout && (
                <div className="p-6 rounded-2xl bg-pulse-surface border border-pulse-border text-center">
                  <p className="font-bold text-white">Todavía no tienes una rutina asignada</p>
                  <p className="text-xs text-pulse-muted mt-1">
                    Tu entrenador te asignará un programa muy pronto.
                  </p>
                </div>
              )}

              {!isRestDay && workout && (
                <>
                  {/* Resumen del día */}
                  <div className="p-4 rounded-2xl bg-pulse-surface border border-pulse-border flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-pulse-lime/10 text-pulse-lime rounded">
                          {workout.template.name}
                        </span>
                      </div>
                      <h2 className="text-sm font-bold text-white">{workout.day.label}</h2>
                      <div className="flex items-center gap-3 text-[11px] text-gray-300 mt-2 font-medium">
                        <span>{completedCount}/{totalCount} ejercicios</span>
                        <span>•</span>
                        <span className="text-pulse-lime font-bold">
                          RPE {workout.assignedRoutine.target_rpe}
                        </span>
                      </div>
                    </div>

                    <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-pulse-border"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-pulse-lime transition-all duration-500 ease-out"
                          strokeDasharray={`${progressPercent}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className="absolute font-black text-xs tabular-nums">{progressPercent}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-extrabold uppercase text-pulse-muted tracking-wider">
                      Series y Cargas
                    </span>
                    <button
                      onClick={() => setShowTimer(true)}
                      className="text-[11px] font-bold text-pulse-lime bg-pulse-surface px-2.5 py-1 rounded-full border border-pulse-border hover:border-pulse-lime flex items-center gap-1.5"
                    >
                      <Clock size={12} /> TIMER DESCANSO
                    </button>
                  </div>

                  <div className="space-y-2">
                    {workout.exercises.map((exercise) => {
                      const completed = exercise.log?.completed ?? false
                      const visual = getExerciseVisual(exercise.name)
                      const pattern = detectMovementPattern(exercise.name)
                      return (
                        <div
                          key={exercise.id}
                          onClick={() => handleToggle(exercise)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            completed
                              ? 'bg-pulse-surface/50 border-pulse-border/60 opacity-90'
                              : 'bg-pulse-surface border-pulse-border hover:border-pulse-border-strong'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setDemoExercise(exercise)
                              }}
                              aria-label={`Ver ejemplo de ${exercise.name}`}
                              className={`w-11 h-11 rounded-lg bg-pulse-card flex items-center justify-center shrink-0 ${visual.colorClass}`}
                            >
                              <StickFigure pattern={pattern} size={28} />
                            </button>
                            <div className="min-w-0">
                              <p
                                className={`text-xs font-bold leading-tight truncate ${
                                  completed ? 'text-gray-300' : 'text-white'
                                }`}
                              >
                                {exercise.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-pulse-muted flex-wrap">
                                <span>
                                  {exercise.sets} × {exercise.reps_min}-{exercise.reps_max}
                                </span>
                                {exercise.suggested_weight_kg && (
                                  <span className="px-1.5 py-0.5 rounded bg-pulse-card text-pulse-lime font-bold">
                                    {exercise.suggested_weight_kg} kg
                                  </span>
                                )}
                                <span>• {exercise.rest_seconds}s</span>
                              </div>
                            </div>
                          </div>
                          <button className="p-1 text-pulse-lime shrink-0" aria-label="Marcar ejercicio">
                            {completed ? (
                              <CheckCircle2 size={24} fill="currentColor" className="text-pulse-lime" />
                            ) : (
                              <Circle size={24} className="text-gray-600" />
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleFinish}
                      disabled={Boolean(workout.session.completed_at)}
                      className="w-full py-3.5 bg-pulse-lime hover:bg-pulse-lime-hover text-black font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <Trophy size={16} />
                      {workout.session.completed_at ? 'Entrenamiento Registrado' : 'Finalizar Entrenamiento'}
                    </button>
                  </div>
                </>
              )}

              {previewDays.length > 0 && (
                <div className="pt-3">
                  <button
                    onClick={() => setShowFullRoutine((v) => !v)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-pulse-surface border border-pulse-border"
                  >
                    <span className="flex items-center gap-2 text-xs font-bold text-white">
                      <CalendarDays size={16} className="text-pulse-lime" />
                      Ver ejemplo de cada sesión ({previewDays.length} días)
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-pulse-muted transition-transform ${
                        showFullRoutine ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showFullRoutine && (
                    <div className="mt-2">
                      {previewLoading ? (
                        <p className="text-center text-pulse-muted py-6 text-sm">
                          Cargando tu rutina completa…
                        </p>
                      ) : (
                        <RoutinePreviewList days={previewDays} />
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-3 pt-4">
              <div className="p-5 rounded-2xl bg-pulse-surface border border-pulse-border flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-pulse-card flex items-center justify-center text-pulse-lime font-black text-lg shrink-0">
                  {(profile?.full_name ?? 'A').charAt(0)}
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-white truncate">{profile?.full_name ?? 'Atleta'}</h2>
                  <p className="text-xs text-pulse-muted truncate">{session?.user.email}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-pulse-surface border border-pulse-border divide-y divide-pulse-border">
                <div className="p-4 flex items-center justify-between">
                  <span className="text-xs text-pulse-muted font-semibold">Rol</span>
                  <span className="text-xs font-bold capitalize">{profile?.role ?? '—'}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="text-xs text-pulse-muted font-semibold">Nivel</span>
                  <span className="text-xs font-bold capitalize">{profile?.level ?? 'Sin definir'}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="text-xs text-pulse-muted font-semibold">Objetivo</span>
                  <span className="text-xs font-bold">{profile?.goal ?? 'Sin definir'}</span>
                </div>
              </div>

              <button
                onClick={signOut}
                className="w-full py-3 rounded-xl bg-pulse-surface border border-pulse-border text-pulse-alert font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <LogOut size={14} /> Cerrar Sesión
              </button>
            </div>
          )}

          {!loading && !error && activeTab === 'progress' && (
            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-2xl bg-pulse-surface border border-pulse-border">
                <h3 className="text-xs font-bold text-gray-300 mb-3">Actividad Semanal</h3>
                <div className="grid grid-cols-7 gap-2 items-end h-28 pt-2">
                  {weekActivity.map((day) => {
                    const heightPercent = day.completed ? 85 : day.hasSession ? 45 : 10
                    return (
                      <div key={day.date} className="flex flex-col items-center gap-1.5 h-full justify-end">
                        <div
                          className={`w-full rounded-md transition-all ${
                            day.completed
                              ? 'bg-pulse-lime'
                              : day.isToday
                                ? 'bg-pulse-lime/50'
                                : 'bg-pulse-card'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span
                          className={`text-[10px] font-bold ${
                            day.isToday ? 'text-pulse-lime' : 'text-pulse-muted'
                          }`}
                        >
                          {day.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-pulse-surface border border-pulse-border rounded-xl">
                  <p className="text-[10px] text-pulse-muted font-bold uppercase">Volumen Semanal</p>
                  <p className="text-lg font-black text-white mt-1 tabular-nums">
                    {Math.round(weeklyVolumeKg).toLocaleString('es')}{' '}
                    <span className="text-xs font-medium text-pulse-lime">kg</span>
                  </p>
                </div>
                <div className="p-3 bg-pulse-surface border border-pulse-border rounded-xl">
                  <p className="text-[10px] text-pulse-muted font-bold uppercase">Racha Activa</p>
                  <p className="text-lg font-black text-pulse-lime mt-1 flex items-center gap-1 tabular-nums">
                    {streak} <span className="text-xs font-medium text-white">Días 🔥</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Modal de ejemplo de ejercicio (muñeco animado) */}
        {demoExercise && (
          <ExerciseDemoModal exercise={demoExercise} onClose={() => setDemoExercise(null)} />
        )}

        {/* Modal de finalización */}
        {showCelebration && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center p-6">
            <div className="bg-pulse-surface border border-pulse-border w-full max-w-sm p-6 rounded-2xl text-center space-y-4">
              <div className="w-14 h-14 bg-pulse-lime/10 border border-pulse-lime text-pulse-lime rounded-full flex items-center justify-center mx-auto">
                <Trophy size={28} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">¡Sesión Completada!</h3>
                <p className="text-xs text-pulse-muted mt-1">
                  Registraste {completedCount} de {totalCount} ejercicios. ¡Sigue así!
                </p>
              </div>
              <button
                onClick={() => setShowCelebration(false)}
                className="w-full py-2.5 bg-pulse-lime text-black font-bold text-xs rounded-xl"
              >
                Volver al Panel
              </button>
            </div>
          </div>
        )}

        {/* Timer de descanso flotante */}
        {showTimer && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-2rem)] max-w-[398px] bg-pulse-card border border-pulse-border p-4 rounded-2xl shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="text-pulse-lime" size={24} />
              <div>
                <p className="text-[10px] text-pulse-muted font-bold uppercase">Descanso en curso</p>
                <p className="text-lg font-mono font-black text-white tabular-nums">{timerSeconds}s</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTimerRunning((r) => !r)}
                className="p-2 rounded-lg bg-pulse-surface text-pulse-lime"
              >
                {isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                onClick={() => {
                  setTimerSeconds(60)
                  setIsTimerRunning(false)
                }}
                className="p-2 rounded-lg bg-pulse-surface text-pulse-muted"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => setShowTimer(false)}
                className="p-2 text-pulse-muted hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <BottomNav active={activeTab} onChange={setActiveTab} />
      </div>
    </div>
  )
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
