import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PageLoader } from '@/shared/components/ui'
import { useAuthStore } from '../stores/auth.store'

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
  const isHydrated = useAuthStore((state) => state.isHydrated)
  const location = useLocation()

  if (!isHydrated) {
    return <PageLoader />
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  const token = useAuthStore((state) => state.token)
  const isHydrated = useAuthStore((state) => state.isHydrated)

  if (!isHydrated) {
    return <PageLoader />
  }

  if (token) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
