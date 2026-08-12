import { apiFetch } from '@/shared/services/api'

export interface PushConfigResponse {
  enabled: boolean
  vapidPublicKey: string | null
}

export interface PushSubscriptionPayload {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export const pushSubscriptionService = {
  getConfig() {
    return apiFetch<PushConfigResponse>('/api/notifications/config')
  },

  subscribe(payload: PushSubscriptionPayload) {
    return apiFetch('/api/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  unsubscribe(endpoint: string) {
    return apiFetch('/api/notifications/subscribe', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint }),
    })
  },
}
