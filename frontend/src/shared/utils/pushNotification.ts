import {
  isMobileDevice,
  isStandalonePwa,
} from '@/features/pwa/utils/pwa.utils'

const PERMISSION_PROMPT_KEY = 'gestao-entregas.notifications-permission-asked'

export function wasNotificationPermissionAsked(): boolean {
  return localStorage.getItem(PERMISSION_PROMPT_KEY) === '1'
}

export function markNotificationPermissionAsked(): void {
  localStorage.setItem(PERMISSION_PROMPT_KEY, '1')
}

export async function requestNotificationPermission(): Promise<NotificationPermission | null> {
  if (!('Notification' in window)) {
    return null
  }

  markNotificationPermissionAsked()

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    return 'denied'
  }

  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

function shouldShowNativeNotification(): boolean {
  if (!('Notification' in window)) return false
  if (Notification.permission !== 'granted') return false

  return (
    document.visibilityState === 'hidden' ||
    isStandalonePwa() ||
    isMobileDevice()
  )
}

export async function showNativeNotification(
  title: string,
  options: { body: string; tag?: string; url?: string },
): Promise<void> {
  if (!shouldShowNativeNotification()) {
    return
  }

  const payload: NotificationOptions = {
    body: options.body,
    tag: options.tag ?? title,
    icon: '/pwa-icon-192.png',
    badge: '/pwa-icon-192.png',
    data: { url: options.url ?? '/' },
  }

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(title, payload)
      return
    } catch {
      // fallback abaixo
    }
  }

  const notification = new Notification(title, payload)
  notification.onclick = () => {
    window.focus()
    if (options.url) {
      window.location.assign(options.url)
    }
    notification.close()
  }
}
