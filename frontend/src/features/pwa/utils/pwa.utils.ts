const PWA_INSTALL_DISMISSED_KEY = 'gestao-entregas.pwa-install-dismissed'

export function isPwaInstallDismissed(): boolean {
  return localStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === '1'
}

export function dismissPwaInstallPrompt(): void {
  localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, '1')
}

export function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

export function isIosDevice(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export function isStandalonePwa(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}
