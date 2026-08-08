import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  isMobileDevice,
  isStandalonePwa,
} from '@/features/pwa/utils/pwa.utils'
import {
  markNotificationPermissionAsked,
  requestNotificationPermission,
  showNativeNotification,
  wasNotificationPermissionAsked,
} from '@/shared/utils/pushNotification'

vi.mock('@/features/pwa/utils/pwa.utils', () => ({
  isMobileDevice: vi.fn(() => false),
  isStandalonePwa: vi.fn(() => false),
}))

describe('pushNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
  })

  it('marca permissão como solicitada', () => {
    expect(wasNotificationPermissionAsked()).toBe(false)
    markNotificationPermissionAsked()
    expect(wasNotificationPermissionAsked()).toBe(true)
  })

  it('não dispara nativa sem permissão', async () => {
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      },
    })

    await requestNotificationPermission()
    await showNativeNotification('Título', { body: 'Corpo' })

    expect(Notification.requestPermission).toHaveBeenCalled()
  })

  it('dispara nativa no mobile com permissão concedida', async () => {
    vi.mocked(isMobileDevice).mockReturnValue(true)

    const showNotification = vi.fn()
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        ready: Promise.resolve({ showNotification }),
      },
    })

    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: {
        permission: 'granted',
      },
    })

    await showNativeNotification('Nova rota', {
      body: '3 entregas',
      url: '/planejador',
    })

    expect(showNotification).toHaveBeenCalledWith(
      'Nova rota',
      expect.objectContaining({ body: '3 entregas' }),
    )
  })

  it('dispara nativa em PWA instalado mesmo no desktop', async () => {
    vi.mocked(isStandalonePwa).mockReturnValue(true)

    const showNotification = vi.fn()
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        ready: Promise.resolve({ showNotification }),
      },
    })

    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: {
        permission: 'granted',
      },
    })

    await showNativeNotification('Prestação aprovada', { body: 'Ok' })

    expect(showNotification).toHaveBeenCalled()
  })
})
