import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useAdminNotifications } from '../hooks/useAdminNotifications'

export function AdminNotificationsListener() {
  const user = useAuthStore((state) => state.user)
  useAdminNotifications(user?.role === 'ADMIN')
  return null
}
