import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { setAccessToken } from '@/features/auth/auth-token'
import App from './App'

const authState = {
  token: 'test-token',
  user: {
    id: '1',
    nome: 'Administrador',
    email: 'admin@test.com',
    role: 'ADMIN' as const,
  },
  isHydrated: true,
  restoreSession: vi.fn(async () => true),
  setHydrated: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  clearSession: vi.fn(),
  setSession: vi.fn(),
}

vi.mock('@/features/auth/stores/auth.store', () => ({
  useAuthStore: (selector: (state: typeof authState) => unknown) =>
    selector(authState),
}))

describe('App', () => {
  beforeEach(() => {
    setAccessToken('test-token')
  })

  it('renderiza o dashboard na rota inicial', async () => {
    render(<App />)
    expect(await screen.findByText('Resumo do dia')).toBeInTheDocument()
  })

  it('renderiza a navegação principal', async () => {
    render(<App />)
    expect(await screen.findByText('Resumo do dia')).toBeInTheDocument()
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Entregas').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pendências').length).toBeGreaterThan(0)
  })
})
