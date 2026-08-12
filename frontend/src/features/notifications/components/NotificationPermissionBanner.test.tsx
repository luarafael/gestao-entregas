import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationPermissionBanner } from './NotificationPermissionBanner'

describe('NotificationPermissionBanner', () => {
  const originalUserAgent = window.navigator.userAgent

  beforeEach(() => {
    localStorage.clear()
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
    })
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      },
    })
  })

  afterEach(() => {
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: originalUserAgent,
    })
  })

  it('nao exibe em desktop', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    })

    render(<NotificationPermissionBanner />)

    expect(
      screen.queryByText(/Ativar notificações no celular/i),
    ).not.toBeInTheDocument()
  })

  it('exibe no mobile e solicita permissão ao tocar', async () => {
    const user = userEvent.setup()

    render(<NotificationPermissionBanner />)

    expect(
      screen.getByText(/Ativar notificações no celular/i),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Permitir notificações' }),
    )

    expect(Notification.requestPermission).toHaveBeenCalled()
    expect(
      screen.queryByText(/Ativar notificações no celular/i),
    ).not.toBeInTheDocument()
  })

  it('permite dispensar o banner', async () => {
    const user = userEvent.setup()

    render(<NotificationPermissionBanner />)

    await user.click(screen.getByRole('button', { name: 'Agora não' }))

    expect(
      screen.queryByText(/Ativar notificações no celular/i),
    ).not.toBeInTheDocument()
  })
})
