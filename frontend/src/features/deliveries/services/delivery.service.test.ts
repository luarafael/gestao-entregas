import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deliveryService } from './delivery.service'
import { apiFetch } from '@/shared/services/api'

vi.mock('@/shared/services/api', () => ({
  apiFetch: vi.fn(),
}))

describe('deliveryService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lista entregas com filtros', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ data: [], meta: {} })

    await deliveryService.list({
      page: 1,
      limit: 10,
      search: ' João ',
      filter: 'week',
      sortBy: 'horario',
      sortOrder: 'desc',
    })

    expect(apiFetch).toHaveBeenCalledWith(
      expect.stringContaining('search=Jo%C3%A3o'),
    )
  })

  it('lista entregas sem termo de busca', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ data: [], meta: {} })

    await deliveryService.list({
      page: 1,
      limit: 10,
      search: '   ',
      filter: 'today',
      sortBy: 'horario',
      sortOrder: 'desc',
    })

    expect(apiFetch).toHaveBeenCalledWith(
      expect.not.stringContaining('search='),
    )
  })

  it('cria entrega', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ id: '1' })

    await deliveryService.create({
      endereco: 'Rua A',
      bairro: 'Centro',
      valorEntrega: 10,
      pagoPeloCliente: false,
    })

    expect(apiFetch).toHaveBeenCalledWith('/api/entregas', expect.any(Object))
  })

  it('atualiza entrega', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ id: '1' })

    await deliveryService.update('1', {
      endereco: 'Rua B',
      bairro: 'Centro',
      valorEntrega: 15,
      pagoPeloCliente: false,
    })

    expect(apiFetch).toHaveBeenCalledWith('/api/entregas/1', expect.any(Object))
  })

  it('busca entrega por id', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ id: '1' })

    await deliveryService.getById('1')

    expect(apiFetch).toHaveBeenCalledWith('/api/entregas/1')
  })
})
