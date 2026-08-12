import { prisma } from '../lib/prisma.js'

export interface UpsertPushSubscriptionInput {
  userId: string
  endpoint: string
  p256dh: string
  auth: string
}

export const pushSubscriptionRepository = {
  upsert(input: UpsertPushSubscriptionInput) {
    return prisma.pushSubscription.upsert({
      where: { endpoint: input.endpoint },
      create: {
        userId: input.userId,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
      },
      update: {
        userId: input.userId,
        p256dh: input.p256dh,
        auth: input.auth,
      },
    })
  },

  deleteByEndpoint(userId: string, endpoint: string) {
    return prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    })
  },

  findByUserIds(userIds: string[]) {
    if (userIds.length === 0) {
      return Promise.resolve([])
    }

    return prisma.pushSubscription.findMany({
      where: { userId: { in: userIds } },
    })
  },

  deleteById(id: string) {
    return prisma.pushSubscription.delete({ where: { id } })
  },
}
