import { useEffect } from 'react'
import { getNotificationPermission, subscribeToWebPush } from '@/shared/utils/pushNotification'

export function useWebPushSubscription(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    const sync = () => {
      if (getNotificationPermission() !== 'granted') return
      void subscribeToWebPush()
    }

    sync()

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        sync()
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', sync)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', sync)
    }
  }, [enabled])
}
