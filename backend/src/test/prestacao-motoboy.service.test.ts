import { beforeEach, describe, it, expect, vi } from 'vitest'
import { PrestacaoMotoboyService } from '../services/prestacao-motoboy.service.js'
import { ConflictError, ForbiddenError } from '../errors/app.error.js'
import type { AuthenticatedUser } from '../middleware/auth.middleware.js'

const entregaRepository = vi.hoisted(() => ({
  getStatsByDate: vi.fn(),
  findByDate: vi.fn(),
}))

const pendenciaRepository = vi.hoisted(() => ({
  findPendingRepasseByMotoboy: vi.fn(),
  findOpenRepasseListByMotoboy: vi.fn(),
  markRepasseReceivedByMotoboy: vi.fn(),
}))

const prestacaoMotoboyRepository = vi.hoisted(() => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByMotoboyAndDate: vi.fn(),
  update: vi.fn(),
  findMany: vi.fn(),
  countPending: vi.fn(),
}))

vi.mock('../repositories/entrega.repository.js', () => ({ entregaRepository }))
vi.mock('../repositories/pendencia.repository.js', () => ({ pendenciaRepository }))
vi.mock('../repositories/prestacao-motoboy.repository.js', () => ({
  prestacaoMotoboyRepository,
}))

const motoboyUser: AuthenticatedUser = {
  id: 'motoboy-1',
  email: 'motoboy@test.com',
  role: 'MOTOBOY',
  nome: 'João',
}

const adminUser: AuthenticatedUser = {
  id: 'admin-1',
  email: 'admin@test.com',
  role: 'ADMIN',
  nome: 'Admin',
}

describe('PrestacaoMotoboyService', () => {
  const service = new PrestacaoMotoboyService()

  beforeEach(() => {
    vi.clearAllMocks()
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
    pendenciaRepository.findOpenRepasseListByMotoboy.mockResolvedValue([
      { id: 'p1', descricao: 'Repasse', valor: 15 },
    ])
    entregaRepository.findByDate.mockResolvedValue([{ id: 'e1' }])
    prestacaoMotoboyRepository.findByMotoboyAndDate.mockResolvedValue(null)
    prestacaoMotoboyRepository.create.mockResolvedValue({
      id: 'pm1',
      motoboyId: 'motoboy-1',
      totalEntregas: 2,
      valorTotal: 30,
      valorPendencias: 15,
      valorFinal: 45,
      status: 'ENVIADA',
      motoboy: { id: 'motoboy-1', nome: 'João', email: 'motoboy@test.com' },
      data: new Date('2026-08-05'),
    })
  })

  it('envia prestação do motoboy', async () => {
    const result = await service.submit(motoboyUser, {})

    expect(prestacaoMotoboyRepository.create).toHaveBeenCalled()
    expect(result.prestacao.status).toBe('ENVIADA')
    expect(result.whatsappText).toContain('João')
  })

  it('bloqueia admin de enviar prestação', async () => {
    await expect(service.submit(adminUser, {})).rejects.toBeInstanceOf(
      ForbiddenError,
    )
  })

  it('impede reenvio quando já enviada', async () => {
    prestacaoMotoboyRepository.findByMotoboyAndDate.mockResolvedValue({
      id: 'pm1',
      status: 'ENVIADA',
    })

    await expect(service.submit(motoboyUser, {})).rejects.toBeInstanceOf(
      ConflictError,
    )
  })

  it('aprova prestação e marca repasses como recebidos', async () => {
    prestacaoMotoboyRepository.findById.mockResolvedValue({
      id: 'pm1',
      status: 'ENVIADA',
      motoboyId: 'motoboy-1',
    })
    prestacaoMotoboyRepository.update.mockResolvedValue({
      id: 'pm1',
      status: 'APROVADA',
    })

    await service.approve(adminUser, 'pm1')

    expect(pendenciaRepository.markRepasseReceivedByMotoboy).toHaveBeenCalledWith(
      'motoboy-1',
    )
  })
})
