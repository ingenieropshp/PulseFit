import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { Profile, Role } from '../types/models'

interface SignUpParams {
  email: string
  password: string
  fullName: string
  role: Role
}

interface AuthContextValue {
  session: Session | null
  profile: Profile | null
  loading: boolean
  // true mientras signIn() está comparando el rol elegido contra el real:
  // las pantallas que redirigen en cuanto hay sesión deben esperar a que
  // esto vuelva a false antes de navegar (ver comentario en signIn).
  verifyingRole: boolean
  signIn: (email: string, password: string, expectedRole: Role) => Promise<{ error: string | null }>
  signUp: (params: SignUpParams) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifyingRole, setVerifyingRole] = useState(false)

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('No se pudo cargar el perfil:', error.message)
      setProfile(null)
      return
    }

    setProfile(data as Profile)
  }

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return
      setSession(initialSession)
      if (initialSession?.user) {
        loadProfile(initialSession.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        loadProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string, expectedRole: Role) {
    // Importante: en cuanto signInWithPassword tiene éxito, el listener
    // onAuthStateChange de más abajo dispara casi al instante (de forma
    // independiente a este función) y deja `session`/`profile` con datos
    // reales. Si una pantalla usara eso para redirigir de inmediato,
    // alcanzaría a navegar al panel correcto ANTES de que termine la
    // verificación de rol de aquí abajo, y el signOut() por
    // rol-incorrecto llegaría demasiado tarde (la pantalla de login ya se
    // habría desmontado, perdiendo el mensaje de error). `verifyingRole`
    // le dice a esas pantallas "todavía no navegues, estoy revisando".
    setVerifyingRole(true)
    try {
      // Paso 1: autenticar con Supabase (credenciales correctas o no).
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        return { error: error.message }
      }

      const userId = data.user?.id
      if (!userId) {
        await supabase.auth.signOut()
        return { error: 'No se pudo verificar la cuenta. Intenta de nuevo.' }
      }

      // Paso 2: comparar el tipo de cuenta que el usuario eligió en el
      // selector (Atleta / Socio vs Entrenador) contra el rol real guardado
      // en su perfil. Esto evita que alguien entre "por accidente" con el
      // botón equivocado y termine en el panel que no le corresponde.
      const { data: profileRow, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (profileError || !profileRow) {
        await supabase.auth.signOut()
        return { error: 'No se pudo verificar el tipo de cuenta. Intenta de nuevo.' }
      }

      if (profileRow.role !== expectedRole) {
        // El rol no coincide: cerramos la sesión que se acaba de abrir y
        // avisamos con qué opción sí debe iniciar sesión esta cuenta.
        await supabase.auth.signOut()
        const rolCorrecto = profileRow.role === 'coach' ? 'Entrenador' : 'Atleta / Socio'
        return {
          error: `Esta cuenta está registrada como "${rolCorrecto}". Selecciona esa opción arriba para iniciar sesión.`,
        }
      }

      return { error: null }
    } finally {
      // Se libera al final, tanto si hubo éxito como si hubo que cerrar
      // la sesión por rol incorrecto: recién ahí es seguro que las
      // pantallas naveguen según el `session`/`profile` ya definitivo.
      setVerifyingRole(false)
    }
  }

  async function signUp({ email, password, fullName, role }: SignUpParams) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function refreshProfile() {
    if (session?.user) {
      await loadProfile(session.user.id)
    }
  }

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, verifyingRole, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return ctx
}
