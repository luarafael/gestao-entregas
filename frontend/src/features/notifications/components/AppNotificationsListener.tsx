import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useAdminNotifications } from '../hooks/useAdminNotifications'
import { useMotoboyNotifications } from '../hooks/useMotoboyNotifications'
import { useWebPushSubscription } from '../hooks/useWebPushSubscription'
import { NotificationPermissionBanner } from './NotificationPermissionBanner'

export function AppNotificationsListener() {
  const user = useAuthStore((state) => state.user)

  useAdminNotifications(user?.role === 'ADMIN')
  useMotoboyNotifications(user?.role === 'MOTOBOY')
  useWebPushSubscription(Boolean(user))

  if (!user) {
    return null
  }

  return <NotificationPermissionBanner />
}
