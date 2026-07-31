import { describe, it, expect, vi, beforeEach } from 'vitest'
import { pendingService } from './pending.service'
import { apiFetch } from '@/shared/services/api'

vi.mock('@/shared/services/api', () => ({
  apiFetch: vi.fn(),
}))

describe('pendingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lista pendências com status', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ data: [], meta: {} })

    await pendingService.list({
      page: 1,
      limit: 10,
      search: '',
      status: 'PENDENTE',
    })

    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringContaining('status=PENDENTE'),
    )
  })

  it('cria pendência convertendo payload', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ id: '1' })

    await pendingService.create({
      descricao: 'Teste',
      valor: 10,
      referenteAoDia: '2026-07-12',
      status: 'PENDENTE',
    })

    expect(apiFetch).toHaveBeenCalledWith(
      '/api/pendencias',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('atualiza e exclui pendência', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ id: '1' })

    await pendingService.update('1', {
      descricao: 'Teste',
      valor: 10,
      referenteAoDia: '2026-07-12',
      status: 'PENDENTE',
    })
    await pendingService.delete('1')
    await pendingService.getById('1')

    expect(apiFetch).toHaveBeenCalledTimes(3)
  })

  it('lista sem filtro de status', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ data: [], meta: {} })

    await pendingService.list({
      page: 1,
      limit: 10,
      search: 'abc',
    })

    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringContaining('search=abc'),
    )
  })
})
