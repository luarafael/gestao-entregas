import { useEffect } from 'react'
import { getNotificationPermission, subscribeToWebPush } from '@/shared/utils/pushNotification'

export function useWebPushSubscription(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    if (getNotificationPermission() !== 'granted') return

    void subscribeToWebPush()
  }, [enabled])
}
