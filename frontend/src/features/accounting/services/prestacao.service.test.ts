import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prestacaoService } from './prestacao.service'
import { apiFetch } from '@/shared/services/api'

vi.mock('@/shared/services/api', () => ({
  apiFetch: vi.fn(),
}))

describe('prestacaoService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lista histórico de prestações', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ data: [], meta: {} })

    await prestacaoService.list({ page: 1, limit: 10 })

    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/prestacoes?page=1'),
    )
  })

  it('gera prestação do dia', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ prestacao: { id: '1' } })

    await prestacaoService.generate({
      data: '2026-07-31',
      observacoes: '',
    })

    expect(apiFetch).toHaveBeenCalledWith(
      '/api/prestacoes/generate',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('busca texto do WhatsApp', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ text: 'texto' })

    await prestacaoService.getWhatsAppText('1')

    expect(apiFetch).toHaveBeenCalledWith('/api/prestacoes/1/whatsapp')
  })

  it('busca eventos de prestação enviada', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ eventos: [] })

    await prestacaoService.getEventos('2026-08-21T12:00:00.000Z')

    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/prestacoes/eventos?since='),
    )
  })
})
