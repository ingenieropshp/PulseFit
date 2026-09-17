// App.tsx: define todas las rutas de la aplicación.
// Estructura:
//   /auth                       -> Login / Registro (público)
//   /dashboard                  -> Panel del Atleta (protegido, solo rol "atleta")
//   /coach                      -> Panel del Entrenador (protegido, solo rol "coach")
//   /coach/assign/:athleteId    -> Asignar Rutina a un atleta (protegido, solo rol "coach")
//   /                           -> Redirige según el rol del usuario autenticado (o a /auth)
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthView } from './views/AuthView'
import { ClientDashboard } from './views/ClientDashboard'
import { CoachDashboard } from './views/CoachDashboard'
import { AssignRoutine } from './views/AssignRoutine'

// Componente pequeño que decide a dónde mandar al usuario cuando visita "/".
// Se ejecuta DESPUÉS de que AuthProvider terminó de cargar sesión/perfil.
function RootRedirect() {
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

  // Si la sesión existe pero el perfil todavía no llegó (carrera con el trigger
  // de creación de perfil), mandamos por defecto al dashboard de atleta;
  // ProtectedRoute se encargará de redirigir correctamente en cuanto el perfil cargue.
  if (profile?.role === 'coach') {
    return <Navigate to="/coach" replace />
  }
  return <Navigate to="/dashboard" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthView />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowRole="atleta">
            <ClientDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/coach"
        element={
          <ProtectedRoute allowRole="coach">
            <CoachDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/coach/assign/:athleteId"
        element={
          <ProtectedRoute allowRole="coach">
            <AssignRoutine />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<RootRedirect />} />

      {/* Cualquier ruta desconocida vuelve al inicio, que resuelve el destino correcto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
