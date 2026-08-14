import { useState } from 'react'
import { Button } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import {
  isIosDevice,
  isMobileDevice,
  isStandalonePwa,
} from '@/features/pwa/utils/pwa.utils'
import {
  dismissNotificationBanner,
  getNotificationPermission,
  isNotificationBannerDismissed,
  requestNotificationPermission,
  subscribeToWebPush,
} from '@/shared/utils/pushNotification'

export function NotificationPermissionBanner() {
  const [visible, setVisible] = useState(() => shouldShowBanner())
  const [isEnabling, setIsEnabling] = useState(false)
  const [blocked, setBlocked] = useState(
    () => getNotificationPermission() === 'denied',
  )

  if (!visible) {
    return null
  }

  const handleDismiss = () => {
    dismissNotificationBanner()
    setVisible(false)
  }

  const handleEnable = async () => {
    setIsEnabling(true)
    setBlocked(false)

    try {
      const result = await requestNotificationPermission()

      if (result === 'granted') {
        await subscribeToWebPush()
        dismissNotificationBanner()
        setVisible(false)
        return
      }

      setBlocked(result === 'denied')
    } finally {
      setIsEnabling(false)
    }
  }

  return (
    <div
      className={cn(
        'fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border border-primary/30',
        'bg-card/95 p-4 shadow-xl backdrop-blur-xl',
        'md:inset-x-auto md:right-6 md:bottom-6',
      )}
      role="dialog"
      aria-labelledby="notification-permission-title"
    >
      <div className="space-y-3">
        <div>
          <p
            id="notification-permission-title"
            className="text-sm font-semibold text-foreground"
          >
            Ativar notificações no celular
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Receba avisos de rotas, entregas, rota concluída, pendências e
            prestações mesmo com o app em segundo plano.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => void handleEnable()} isLoading={isEnabling}>
            Ativar
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDismiss}>
            Agora não
          </Button>
        </div>

        {blocked ? (
          <p className="text-xs text-muted-foreground">
            O celular não mostrou o aviso. Toque em Ativar de novo para tentar
            liberar pelo próprio app.
          </p>
        ) : null}
      </div>
    </div>
  )
}

function shouldShowBanner(): boolean {
  if (!isMobileDevice()) return false
  if (isNotificationBannerDismissed()) return false
  if (getNotificationPermission() === 'granted') return false
  if (!('Notification' in window)) return false
  if (isIosDevice() && !isStandalonePwa()) return false
  return true
}
