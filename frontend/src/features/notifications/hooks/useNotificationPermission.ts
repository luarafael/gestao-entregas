import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import {
  requestNotificationPermission,
  wasNotificationPermissionAsked,
} from '@/shared/utils/pushNotification'

export function useNotificationPermission() {
  const user = useAuthStore((state) => state.user)
  const isHydrated = useAuthStore((state) => state.isHydrated)

  useEffect(() => {
    if (!isHydrated || !user) return
    if (wasNotificationPermissionAsked()) return

    void requestNotificationPermission()
  }, [isHydrated, user])
}
