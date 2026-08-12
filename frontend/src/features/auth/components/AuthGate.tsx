import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PageLoader } from '@/shared/components/ui'
import { useAuthStore } from '../stores/auth.store'
import {
  canAccessAdminArea,
  canAccessRoute,
  getDefaultHomePath,
} from '../utils/permissions'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const restoreSession = useAuthStore((state) => state.restoreSession)
  const isHydrated = useAuthStore((state) => state.isHydrated)
  const setHydrated = useAuthStore((state) => state.setHydrated)

  useEffect(() => {
    let active = true

    void (async () => {
      await restoreSession()
      if (active) {
        setHydrated(true)
      }
    })()

    return () => {
      active = false
    }
  }, [restoreSession, setHydrated])

  if (!isHydrated) {
    return <PageLoader />
  }

  return children
}

export function ProtectedRoute() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const isHydrated = useAuthStore((state) => state.isHydrated)
  const location = useLocation()

  if (!isHydrated) {
    return <PageLoader />
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user?.mustChangePassword && location.pathname !== '/redefinir-senha') {
    return <Navigate to="/redefinir-senha" replace />
  }

  if (user && !user.mustChangePassword && location.pathname === '/redefinir-senha') {
    return <Navigate to={getDefaultHomePath(user.role)} replace />
  }

  if (user && location.pathname !== '/redefinir-senha' && !canAccessRoute(user.role, location.pathname)) {
    return <Navigate to={getDefaultHomePath(user.role)} replace />
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const isHydrated = useAuthStore((state) => state.isHydrated)

  if (!isHydrated) {
    return <PageLoader />
  }

  if (token) {
    if (user?.mustChangePassword) {
      return <Navigate to="/redefinir-senha" replace />
    }

    return <Navigate to={user ? getDefaultHomePath(user.role) : '/'} replace />
  }

  return <Outlet />
}

export function AdminRoute() {
  const user = useAuthStore((state) => state.user)
  const isHydrated = useAuthStore((state) => state.isHydrated)

  if (!isHydrated) {
    return <PageLoader />
  }

  if (!user || !canAccessAdminArea(user.role)) {
    return <Navigate to={getDefaultHomePath(user?.role ?? 'MOTOBOY')} replace />
  }

  return <Outlet />
}
