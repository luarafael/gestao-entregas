import { useEffect, useState } from 'react'
import { Button } from '@/shared/components/ui'
import { cn } from '@/shared/utils/cn'
import {
  dismissPwaInstallPrompt,
  isIosDevice,
  isMobileDevice,
  isPwaInstallDismissed,
  isStandalonePwa,
} from '../utils/pwa.utils'

const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'Gestão de Entregas'

export function PwaInstallPrompt() {
  const shouldOfferInstall =
    !isPwaInstallDismissed() && !isStandalonePwa() && isMobileDevice()
  const isIos = isIosDevice()

  const [visible, setVisible] = useState(shouldOfferInstall)
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (!shouldOfferInstall) {
      return
    }

    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault()
      setDeferredPrompt(event)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [shouldOfferInstall])

  const handleDismiss = () => {
    dismissPwaInstallPrompt()
    setVisible(false)
  }

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return
    }

    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice

    if (choice.outcome === 'accepted') {
      dismissPwaInstallPrompt()
      setVisible(false)
    }

    setDeferredPrompt(null)
  }

  if (!visible || !shouldOfferInstall) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border border-border/70',
        'bg-card/95 p-4 shadow-xl backdrop-blur-xl',
        'md:inset-x-auto md:right-6 md:bottom-6',
      )}
      role="dialog"
      aria-labelledby="pwa-install-title"
    >
      <div className="flex items-start gap-3">
        <img
          src="/pwa-icon-192.png"
          alt=""
          className="size-12 rounded-xl border border-border/60 object-contain"
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p id="pwa-install-title" className="text-sm font-semibold text-foreground">
              Instalar {APP_NAME}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isIos
                ? 'Toque em Compartilhar e depois em "Adicionar à Tela de Início" para acesso rápido.'
                : 'Adicione o app à tela inicial do celular para abrir como um aplicativo.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isIos && deferredPrompt ? (
              <Button size="sm" onClick={handleInstall}>
                Instalar app
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Agora não
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
