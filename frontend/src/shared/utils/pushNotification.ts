import { getServiceWorkerRegistration } from '@/features/pwa/register-pwa'
import {
  isMobileDevice,
  isStandalonePwa,
} from '@/features/pwa/utils/pwa.utils'

const PERMISSION_PROMPT_KEY = 'gestao-entregas.notifications-permission-asked'
const BANNER_DISMISSED_KEY = 'gestao-entregas.notifications-banner-dismissed'

export function wasNotificationPermissionAsked(): boolean {
  return localStorage.getItem(PERMISSION_PROMPT_KEY) === '1'
}

export function markNotificationPermissionAsked(): void {
  localStorage.setItem(PERMISSION_PROMPT_KEY, '1')
}

export function isNotificationBannerDismissed(): boolean {
  return localStorage.getItem(BANNER_DISMISSED_KEY) === '1'
}

export function dismissNotificationBanner(): void {
  localStorage.setItem(BANNER_DISMISSED_KEY, '1')
}

export function getNotificationPermission(): NotificationPermission | null {
  if (!('Notification' in window)) {
    return null
  }

  return Notification.permission
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

  const payload = {
    body: options.body,
    tag: options.tag ?? title,
    renotify: true,
    icon: '/pwa-icon-192.png',
    badge: '/pwa-icon-192.png',
    data: { url: options.url ?? '/' },
    ...(isMobileDevice() ? { vibrate: [200, 100, 200] as number[] } : {}),
  } satisfies NotificationOptions & { renotify?: boolean; vibrate?: number[] }

  const registration = await getServiceWorkerRegistration()

  if (registration) {
    try {
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
