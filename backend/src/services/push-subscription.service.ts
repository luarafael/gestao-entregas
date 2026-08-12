import type { AuthenticatedUser } from '../middleware/auth.middleware.js'
import { env } from '../config/env.js'
import { pushSubscriptionRepository } from '../repositories/push-subscription.repository.js'
import { isPushConfigured } from './push-notification.service.js'
import type {
  PushSubscriptionInput,
  PushUnsubscribeInput,
} from '../schemas/push-subscription.schema.js'

export class PushSubscriptionService {
  getConfig() {
    return {
      enabled: isPushConfigured(),
      vapidPublicKey: env.VAPID_PUBLIC_KEY || null,
    }
  }

  async subscribe(user: AuthenticatedUser, input: PushSubscriptionInput) {
    return pushSubscriptionRepository.upsert({
      userId: user.id,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
    })
  }

  async unsubscribe(user: AuthenticatedUser, input: PushUnsubscribeInput) {
    await pushSubscriptionRepository.deleteByEndpoint(user.id, input.endpoint)
  }
}

export const pushSubscriptionService = new PushSubscriptionService()
