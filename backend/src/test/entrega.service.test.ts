import { beforeEach, describe, it, expect, vi } from 'vitest'
import { EntregaService } from '../services/entrega.service.js'
import { ForbiddenError, NotFoundError } from '../errors/app.error.js'
import type { AuthenticatedUser } from '../middleware/auth.middleware.js'

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
  findPendingRepasseByMotoboy: vi.fn(),
}))

vi.mock('../repositories/entrega.repository.js', () => ({
  entregaRepository,
}))

vi.mock('../repositories/pendencia.repository.js', () => ({
  pendenciaRepository,
}))

const adminUser: AuthenticatedUser = {
  id: 'admin-1',
  email: 'admin@test.com',
  role: 'ADMIN',
  nome: 'Admin',
}

const motoboyUser: AuthenticatedUser = {
  id: 'motoboy-1',
  email: 'motoboy@test.com',
  role: 'MOTOBOY',
  nome: 'Motoboy',
}

describe('EntregaService', () => {
  const service = new EntregaService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('cria entrega vinculada ao motoboy', async () => {
    entregaRepository.create.mockResolvedValue({ id: '1', motoboyId: 'motoboy-1' })

    const result = await service.create(motoboyUser, {
      endereco: 'Rua A',
      bairro: 'Centro',
      valorEntrega: 10,
    })

    expect(entregaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ endereco: 'Rua A' }),
      'motoboy-1',
    )
    expect(result).toEqual({ id: '1', motoboyId: 'motoboy-1' })
  })

  it('exige motoboyId quando admin cria entrega', async () => {
    await expect(
      service.create(adminUser, {
        endereco: 'Rua A',
        bairro: 'Centro',
        valorEntrega: 10,
      }),
    ).rejects.toThrow('Selecione o motoboy responsável pela entrega')
  })

  it('admin cria entrega para motoboy selecionado', async () => {
    entregaRepository.create.mockResolvedValue({
      id: '1',
      motoboyId: 'motoboy-1',
    })

    await service.create(adminUser, {
      endereco: 'Rua A',
      bairro: 'Centro',
      valorEntrega: 10,
      motoboyId: 'motoboy-1',
    })

    expect(entregaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ endereco: 'Rua A' }),
      'motoboy-1',
    )
  })

  it('lança NotFoundError quando entrega não existe', async () => {
    entregaRepository.findById.mockResolvedValue(null)

    await expect(service.findById(adminUser, 'x')).rejects.toBeInstanceOf(
      NotFoundError,
    )
  })

  it('bloqueia motoboy de acessar entrega de outro', async () => {
    entregaRepository.findById.mockResolvedValue({
      id: '1',
      motoboyId: 'outro',
    })

    await expect(service.findById(motoboyUser, '1')).rejects.toBeInstanceOf(
      ForbiddenError,
    )
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

    expect(entregaRepository.getStatsByDate).toHaveBeenCalledWith(
      expect.any(Date),
      undefined,
    )
    expect(pendenciaRepository.getPendingTotal).toHaveBeenCalledWith(undefined)
    expect(stats).toEqual({
      entregasHoje: 3,
      valorRecebidoHoje: 90,
      totalPendencias: 1,
      valorTotalDia: 110,
    })
  })

  it('retorna estatísticas do dashboard filtradas por motoboy', async () => {
    entregaRepository.getStatsByDate.mockResolvedValue({
      totalEntregas: 1,
      valorTotal: 30,
    })
    pendenciaRepository.getPendingTotal.mockResolvedValue({
      totalPendencias: 0,
      valorPendencias: 0,
    })

    await service.getDashboardStats(undefined, 'motoboy-1')

    expect(entregaRepository.getStatsByDate).toHaveBeenCalledWith(
      expect.any(Date),
      'motoboy-1',
    )
    expect(pendenciaRepository.getPendingTotal).toHaveBeenCalledWith(
      'motoboy-1',
    )
  })

  it('retorna resumo do motoboy', async () => {
    entregaRepository.getStatsByDate.mockResolvedValue({
      totalEntregas: 2,
      valorTotal: 30,
      entregasPagasPeloCliente: 0,
      valorPagasPeloCliente: 0,
    })
    pendenciaRepository.findPendingRepasseByMotoboy.mockResolvedValue({
      totalPendencias: 1,
      valorPendencias: 15,
    })
    entregaRepository.findByDate.mockResolvedValue([{ id: '1' }])

    const resumo = await service.getMotoboyResumo(motoboyUser)

    expect(resumo.entregasHoje).toBe(2)
    expect(resumo.valorRecebidoHoje).toBe(30)
    expect(resumo.pendenciasAbertas).toBe(1)
    expect(resumo.entregas).toHaveLength(1)
  })

  it('lista entregas paginadas com escopo do motoboy', async () => {
    entregaRepository.findMany.mockResolvedValue({
      data: [{ id: '1' }],
      total: 1,
    })

    const result = await service.list(motoboyUser, {
      page: 1,
      limit: 10,
      filter: 'today',
      sortBy: 'horario',
      sortOrder: 'desc',
    })

    expect(entregaRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ motoboyId: 'motoboy-1' }),
    )
    expect(result.meta.totalPages).toBe(1)
    expect(result.data).toHaveLength(1)
  })

  it('atualiza e exclui entrega existente', async () => {
    entregaRepository.findById.mockResolvedValue({ id: '1', motoboyId: null })
    entregaRepository.update.mockResolvedValue({ id: '1' })
    entregaRepository.delete.mockResolvedValue({ id: '1' })

    await expect(
      service.update(adminUser, '1', {
        endereco: 'Rua B',
        bairro: 'Centro',
        valorEntrega: 10,
      }),
    ).resolves.toEqual({ id: '1' })
    await expect(service.delete('1')).resolves.toEqual({ id: '1' })
  })

  it('retorna entregas do dia', async () => {
    entregaRepository.findByDate.mockResolvedValue([{ id: '1' }])

    await expect(service.getTodayDeliveries()).resolves.toHaveLength(1)
  })
})
