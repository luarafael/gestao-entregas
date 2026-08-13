import { getServiceWorkerRegistration } from '@/features/pwa/register-pwa'
import { pushSubscriptionService } from '@/features/notifications/services/pushSubscription.service'
import {
  applicationServerKeysMatch,
  urlBase64ToUint8Array,
} from '@/features/notifications/utils/webPush.utils'
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

async function resolveVapidPublicKey(): Promise<string | null> {
  const envKey = import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim()
  if (envKey) {
    return envKey
  }

  try {
    const config = await pushSubscriptionService.getConfig()
    return config.enabled ? config.vapidPublicKey : null
  } catch {
    return null
  }
}

export async function subscribeToWebPush(): Promise<boolean> {
  if (!('PushManager' in window)) {
    return false
  }

  if (getNotificationPermission() !== 'granted') {
    return false
  }

  try {
    const vapidPublicKey = await resolveVapidPublicKey()
    if (!vapidPublicKey) {
      return false
    }

    const registration = await getServiceWorkerRegistration()
    if (!registration) {
      return false
    }

    let subscription = await registration.pushManager.getSubscription()

    if (
      subscription &&
      !applicationServerKeysMatch(
        subscription.options.applicationServerKey ?? null,
        vapidPublicKey,
      )
    ) {
      await subscription.unsubscribe()
      subscription = null
    }

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })
    }

    const json = subscription.toJSON()
    if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
      return false
    }

    await pushSubscriptionService.subscribe({
      endpoint: json.endpoint,
      keys: {
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
    })

    return true
  } catch {
    return false
  }
}
