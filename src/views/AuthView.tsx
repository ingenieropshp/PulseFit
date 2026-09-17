import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Zap,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Badge,
  Dumbbell,
  ClipboardList,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../types/models'

type Mode = 'login' | 'register'

export function AuthView() {
  const { session, profile, loading, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [role, setRole] = useState<Role>('atleta')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Si ya hay sesión activa, saltamos directo al panel correspondiente.
  if (!loading && session) {
    if (!profile) {
      // Perfil aún sincronizándose (trigger recién disparado); esperamos un tick.
      return (
        <div className="flex min-h-screen items-center justify-center bg-pulse-bg text-pulse-muted">
          Preparando tu cuenta…
        </div>
      )
    }
    return <Navigate to={profile.role === 'coach' ? '/coach' : '/dashboard'} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)

    if (mode === 'register' && fullName.trim().length < 3) {
      setError('Ingresa tu nombre completo.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'login') {
        const { error: signInError } = await signIn(email, password)
        if (signInError) setError(traducirError(signInError))
      } else {
        const { error: signUpError } = await signUp({ email, password, fullName, role })
        if (signUpError) {
          setError(traducirError(signUpError))
        } else {
          setNotice(
            'Cuenta creada. Si tu proyecto requiere confirmación por correo, revisa tu bandeja antes de iniciar sesión.'
          )
          setMode('login')
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex justify-center bg-black min-h-screen font-sans text-white">
      <div className="w-full max-w-[420px] flex flex-col px-margin-mobile py-space-xl">
        {/* Encabezado de marca */}
        <div className="relative overflow-hidden rounded-xl bg-pulse-surface mb-space-md p-space-md">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-pulse-lime/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center gap-space-xs">
            <div className="w-9 h-9 rounded-full bg-pulse-lime flex items-center justify-center text-black shadow-md">
              <Zap size={18} fill="black" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-headline-sm tracking-tight">PulseFit</span>
              <span className="font-label-sm text-pulse-lime uppercase tracking-wider">
                Titan Pulse
              </span>
            </div>
          </div>
        </div>

        {/* Tabs Login / Registro */}
        <div className="relative bg-pulse-bg-alt p-1 rounded-full flex items-center justify-between mb-space-lg">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`w-1/2 py-2.5 rounded-full font-label-lg flex items-center justify-center gap-1.5 transition-all ${
              mode === 'login'
                ? 'bg-pulse-card text-pulse-lime shadow-md'
                : 'text-pulse-muted hover:text-white'
            }`}
          >
            <LogIn size={16} /> Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`w-1/2 py-2.5 rounded-full font-label-lg flex items-center justify-center gap-1.5 transition-all ${
              mode === 'register'
                ? 'bg-pulse-card text-pulse-lime shadow-md'
                : 'text-pulse-muted hover:text-white'
            }`}
          >
            <UserPlus size={16} /> Crear Cuenta
          </button>
        </div>

        {/* Selector de rol */}
        <div className="mb-space-md p-space-sm bg-pulse-bg-alt rounded-xl flex flex-col gap-2">
          <span className="font-label-sm text-pulse-muted uppercase tracking-wider px-1">
            Tipo de cuenta
          </span>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-pulse-surface rounded-lg">
            <button
              type="button"
              onClick={() => setRole('atleta')}
              className={`py-2 rounded-md font-label-sm flex items-center justify-center gap-1.5 transition-all ${
                role === 'atleta'
                  ? 'bg-pulse-card text-white font-bold shadow-sm'
                  : 'text-pulse-muted hover:text-white'
              }`}
            >
              <Dumbbell size={14} className={role === 'atleta' ? 'text-pulse-lime' : ''} />
              Atleta / Socio
            </button>
            <button
              type="button"
              onClick={() => setRole('coach')}
              className={`py-2 rounded-md font-label-sm flex items-center justify-center gap-1.5 transition-all ${
                role === 'coach'
                  ? 'bg-pulse-card text-white font-bold shadow-sm'
                  : 'text-pulse-muted hover:text-white'
              }`}
            >
              <ClipboardList size={14} className={role === 'coach' ? 'text-pulse-lime' : ''} />
              Entrenador
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
          {mode === 'register' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fullName" className="font-label-md text-white">
                Nombre completo
              </label>
              <div className="flex items-center bg-pulse-bg-alt rounded-xl px-3.5 py-3 focus-within:bg-pulse-surface transition-colors">
                <Badge size={18} className="text-pulse-muted mr-3" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Carlos Méndez"
                  className="w-full bg-transparent text-white font-body-md placeholder:text-pulse-muted/60 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="font-label-md text-white">
              Correo electrónico
            </label>
            <div className="flex items-center bg-pulse-bg-alt rounded-xl px-3.5 py-3 focus-within:bg-pulse-surface transition-colors">
              <Mail size={18} className="text-pulse-muted mr-3" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full bg-transparent text-white font-body-md placeholder:text-pulse-muted/60 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="font-label-md text-white">
              Contraseña
            </label>
            <div className="flex items-center bg-pulse-bg-alt rounded-xl px-3.5 py-3 focus-within:bg-pulse-surface transition-colors">
              <Lock size={18} className="text-pulse-muted mr-3" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-transparent text-white font-body-md placeholder:text-pulse-muted/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-pulse-muted hover:text-white"
                aria-label="Mostrar u ocultar contraseña"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-pulse-alert bg-pulse-alert/10 border border-pulse-alert/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {notice && (
            <p className="text-sm text-pulse-emerald bg-pulse-emerald/10 border border-pulse-emerald/30 rounded-lg px-3 py-2">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-space-xs py-3.5 px-6 rounded-full bg-pulse-lime hover:bg-pulse-lime-hover text-black font-label-lg font-bold tracking-wide uppercase shadow-lg active:scale-[0.98] transition-all disabled:opacity-60 disabled:active:scale-100"
          >
            {submitting
              ? 'Procesando…'
              : mode === 'login'
                ? 'Entrar al Gimnasio'
                : 'Crear mi Cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}

function traducirError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'Correo o contraseña incorrectos.'
  }
  if (message.includes('User already registered')) {
    return 'Ya existe una cuenta con este correo.'
  }
  return message
}
