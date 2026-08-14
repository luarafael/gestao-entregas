import { beforeEach, describe, expect, it, vi } from 'vitest'

const webpush = vi.hoisted(() => ({
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn(),
}))

const pushSubscriptionRepository = vi.hoisted(() => ({
  findByUserIds: vi.fn(),
  deleteById: vi.fn(),
}))

const usuarioRepository = vi.hoisted(() => ({
  findActiveAdminIds: vi.fn(),
}))

vi.mock('web-push', () => ({
  default: webpush,
}))

vi.mock('../repositories/push-subscription.repository.js', () => ({
  pushSubscriptionRepository,
}))

vi.mock('../repositories/usuario.repository.js', () => ({
  usuarioRepository,
}))

vi.mock('../config/env.js', () => ({
  env: {
    VAPID_PUBLIC_KEY: 'public-key',
    VAPID_PRIVATE_KEY: 'private-key',
    VAPID_SUBJECT: 'mailto:test@example.com',
  },
}))

describe('PushNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('envia push para motoboy quando há subscription', async () => {
    pushSubscriptionRepository.findByUserIds.mockResolvedValue([
      {
        id: 'sub-1',
        endpoint: 'https://push.example/1',
        p256dh: 'key',
        auth: 'auth',
      },
    ])
    webpush.sendNotification.mockResolvedValue(undefined)

    const { pushNotificationService } = await import(
      '../services/push-notification.service.js'
    )

    pushNotificationService.notifyMotoboyNewRoute('motoboy-1', {
      rotaId: 'rota-1',
      totalParadas: 3,
      enderecoInicial: 'Rua A, 10',
    })

    await vi.waitFor(() => {
      expect(webpush.sendNotification).toHaveBeenCalledWith(
        {
          endpoint: 'https://push.example/1',
          keys: { p256dh: 'key', auth: 'auth' },
        },
        expect.stringContaining('Nova rota planejada'),
        expect.objectContaining({
          TTL: 60 * 60 * 24,
          urgency: 'high',
        }),
      )
    })
  })

  it('remove subscription expirada', async () => {
    pushSubscriptionRepository.findByUserIds.mockResolvedValue([
      {
        id: 'sub-dead',
        endpoint: 'https://push.example/dead',
        p256dh: 'key',
        auth: 'auth',
      },
    ])
    webpush.sendNotification.mockRejectedValue({ statusCode: 410 })

    const { pushNotificationService } = await import(
      '../services/push-notification.service.js'
    )

    pushNotificationService.notifyMotoboyNewRoute('motoboy-1', {
      rotaId: 'rota-1',
      totalParadas: 1,
      enderecoInicial: 'Rua B',
    })

    await vi.waitFor(() => {
      expect(pushSubscriptionRepository.deleteById).toHaveBeenCalledWith(
        'sub-dead',
      )
    })
  })

  it('notifica admins ativos', async () => {
    usuarioRepository.findActiveAdminIds.mockResolvedValue(['admin-1'])
    pushSubscriptionRepository.findByUserIds.mockResolvedValue([
      {
        id: 'sub-admin',
        endpoint: 'https://push.example/admin',
        p256dh: 'key',
        auth: 'auth',
      },
    ])
    webpush.sendNotification.mockResolvedValue(undefined)

    const { pushNotificationService } = await import(
      '../services/push-notification.service.js'
    )

    pushNotificationService.notifyAdminsNewApproval({
      prestacaoId: 'prest-1',
      motoboyNome: 'João',
      data: '2026-08-12',
    })

    await vi.waitFor(() => {
      expect(usuarioRepository.findActiveAdminIds).toHaveBeenCalled()
      expect(webpush.sendNotification).toHaveBeenCalled()
    })
  })

  it('envia push de rota concluida para admins', async () => {
    usuarioRepository.findActiveAdminIds.mockResolvedValue(['admin-1'])
    pushSubscriptionRepository.findByUserIds.mockResolvedValue([
      {
        id: 'sub-admin',
        endpoint: 'https://push.example/admin',
        p256dh: 'key',
        auth: 'auth',
      },
    ])
    webpush.sendNotification.mockResolvedValue(undefined)

    const { pushNotificationService } = await import(
      '../services/push-notification.service.js'
    )

    pushNotificationService.notifyAdminsRouteCompleted({
      rotaId: 'rota-1',
      motoboyNome: 'João',
      totalParadas: 4,
      concluidaEm: new Date('2026-08-14T15:00:00.000Z'),
    })

    await vi.waitFor(() => {
      expect(webpush.sendNotification).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('Rota concluída'),
        expect.objectContaining({ urgency: 'high' }),
      )
    })
  })
})
