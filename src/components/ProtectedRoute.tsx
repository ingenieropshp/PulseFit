import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../types/models'

interface ProtectedRouteProps {
  children: ReactNode
  /** Si se define, solo ese rol puede entrar; el otro rol es redirigido a su propio panel. */
  allowRole?: Role
}

export function ProtectedRoute({ children, allowRole }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pulse-bg text-pulse-muted">
        Cargando…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/auth" replace />
  }

  if (allowRole && profile && profile.role !== allowRole) {
    return <Navigate to={profile.role === 'coach' ? '/coach' : '/dashboard'} replace />
  }

  return <>{children}</>
}
