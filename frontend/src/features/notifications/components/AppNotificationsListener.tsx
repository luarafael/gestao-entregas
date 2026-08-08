import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useAdminNotifications } from '../hooks/useAdminNotifications'
import { useMotoboyNotifications } from '../hooks/useMotoboyNotifications'
import { useNotificationPermission } from '../hooks/useNotificationPermission'

export function AppNotificationsListener() {
  const user = useAuthStore((state) => state.user)

  useNotificationPermission()
  useAdminNotifications(user?.role === 'ADMIN')
  useMotoboyNotifications(user?.role === 'MOTOBOY')

  return null
}
