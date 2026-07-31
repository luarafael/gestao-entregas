import { beforeEach, describe, it, expect, vi } from 'vitest'
import { EntregaService } from '../services/entrega.service.js'
import { NotFoundError } from '../errors/app.error.js'

const entregaRepository = vi.hoisted(() => ({
  create: vi.fn(),
  findById: vi.fn(),
  findMany: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getStatsByDate: vi.fn(),
  findByDate: vi.fn(),
}))

const pendenciaRepository = vi.hoisted(() => ({
  getPendingTotal: vi.fn(),
}))

vi.mock('../repositories/entrega.repository.js', () => ({
  entregaRepository,
}))

vi.mock('../repositories/pendencia.repository.js', () => ({
  pendenciaRepository,
}))

describe('EntregaService', () => {
  const service = new EntregaService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('cria entrega', async () => {
    entregaRepository.create.mockResolvedValue({ id: '1' })

    const result = await service.create({
      endereco: 'Rua A',
      bairro: 'Centro',
      valorEntrega: 10,
    })

    expect(result).toEqual({ id: '1' })
  })

  it('lança NotFoundError quando entrega não existe', async () => {
    entregaRepository.findById.mockResolvedValue(null)

    await expect(service.findById('x')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('retorna estatísticas do dashboard', async () => {
    entregaRepository.getStatsByDate.mockResolvedValue({
      totalEntregas: 3,
      valorTotal: 90,
    })
    pendenciaRepository.getPendingTotal.mockResolvedValue({
      totalPendencias: 1,
      valorPendencias: 20,
    })

    const stats = await service.getDashboardStats()

    expect(stats).toEqual({
      entregasHoje: 3,
      valorRecebidoHoje: 90,
      totalPendencias: 1,
      valorTotalDia: 110,
    })
  })

  it('lista entregas paginadas', async () => {
    entregaRepository.findMany.mockResolvedValue({
      data: [{ id: '1' }],
      total: 1,
    })

    const result = await service.list({
      page: 1,
      limit: 10,
      filter: 'today',
      sortBy: 'horario',
      sortOrder: 'desc',
    })

    expect(result.meta.totalPages).toBe(1)
    expect(result.data).toHaveLength(1)
  })

  it('atualiza e exclui entrega existente', async () => {
    entregaRepository.findById.mockResolvedValue({ id: '1' })
    entregaRepository.update.mockResolvedValue({ id: '1' })
    entregaRepository.delete.mockResolvedValue({ id: '1' })

    await expect(
      service.update('1', { endereco: 'Rua B', bairro: 'Centro', valorEntrega: 10 }),
    ).resolves.toEqual({ id: '1' })
    await expect(service.delete('1')).resolves.toEqual({ id: '1' })
  })

  it('retorna entregas do dia', async () => {
    entregaRepository.findByDate.mockResolvedValue([{ id: '1' }])

    await expect(service.getTodayDeliveries()).resolves.toHaveLength(1)
  })
})
