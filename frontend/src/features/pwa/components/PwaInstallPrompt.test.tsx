import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PwaInstallPrompt } from './PwaInstallPrompt'

describe('PwaInstallPrompt', () => {
  const originalUserAgent = window.navigator.userAgent

  beforeEach(() => {
    localStorage.clear()
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: originalUserAgent,
    })
  })

  afterEach(() => {
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: originalUserAgent,
    })
  })

  it('nao exibe em desktop', () => {
    render(<PwaInstallPrompt />)
    expect(screen.queryByText(/Instalar/i)).not.toBeInTheDocument()
  })

  it('exibe instrucoes no mobile e permite dispensar', async () => {
    const user = userEvent.setup()

    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    })

    render(<PwaInstallPrompt />)

    expect(screen.getByText(/Instalar/i)).toBeInTheDocument()
    expect(screen.getByText(/Adicionar à Tela de Início/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Agora não' }))

    expect(screen.queryByText(/Instalar/i)).not.toBeInTheDocument()
  })
})
