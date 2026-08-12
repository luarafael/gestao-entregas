import { beforeEach, describe, it, expect, vi } from 'vitest'
import { PrestacaoMotoboyService } from '../services/prestacao-motoboy.service.js'
import {
  ConflictError,
  ForbiddenError,
  ValidationError,
} from '../errors/app.error.js'
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

const usuarioRepository = vi.hoisted(() => ({
  findMotoboyById: vi.fn(),
}))

vi.mock('../repositories/entrega.repository.js', () => ({ entregaRepository }))
vi.mock('../repositories/pendencia.repository.js', () => ({ pendenciaRepository }))
vi.mock('../repositories/prestacao-motoboy.repository.js', () => ({
  prestacaoMotoboyRepository,
}))
vi.mock('../repositories/usuario.repository.js', () => ({
  usuarioRepository,
}))
vi.mock('../services/push-notification.service.js', () => ({
  pushNotificationService: {
    notifyAdminsNewApproval: vi.fn(),
    notifyMotoboyPrestacaoApproved: vi.fn(),
    notifyMotoboyPrestacaoRejected: vi.fn(),
  },
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
    usuarioRepository.findMotoboyById.mockResolvedValue({
      id: 'motoboy-1',
      nome: 'João',
      email: 'motoboy@test.com',
      pix: '11999998888',
      role: 'MOTOBOY',
      ativo: true,
    })
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
    expect(result.whatsappText).toContain('*PIX:* 11999998888')
  })

  it('exige motoboyId quando admin envia prestação', async () => {
    await expect(service.submit(adminUser, {})).rejects.toBeInstanceOf(
      ValidationError,
    )
  })

  it('permite admin enviar prestação em nome do motoboy', async () => {
    usuarioRepository.findMotoboyById.mockResolvedValue({
      id: 'motoboy-1',
      nome: 'João',
      ativo: true,
    })

    const result = await service.submit(adminUser, { motoboyId: 'motoboy-1' })

    expect(usuarioRepository.findMotoboyById).toHaveBeenCalledWith('motoboy-1')
    expect(prestacaoMotoboyRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ motoboyId: 'motoboy-1' }),
    )
    expect(result.prestacao.status).toBe('ENVIADA')
  })

  it('prévia do admin exige motoboy selecionado', async () => {
    await expect(service.preview(adminUser, {})).rejects.toBeInstanceOf(
      ValidationError,
    )
  })

  it('prévia do admin por motoboy', async () => {
    usuarioRepository.findMotoboyById.mockResolvedValue({
      id: 'motoboy-1',
      nome: 'João',
      ativo: true,
    })

    const preview = await service.preview(adminUser, {
      motoboyId: 'motoboy-1',
      data: new Date('2026-08-05'),
    })

    expect(entregaRepository.getStatsByDate).toHaveBeenCalledWith(
      expect.any(Date),
      { motoboyId: 'motoboy-1' },
    )
    expect(preview.valorFinal).toBe(45)
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

  it('lista pendentes filtrando por motoboy', async () => {
    prestacaoMotoboyRepository.findMany.mockResolvedValue({
      data: [{ id: 'pm1' }],
      total: 1,
    })

    const result = await service.listPending(adminUser, 'motoboy-1')

    expect(prestacaoMotoboyRepository.findMany).toHaveBeenCalledWith({
      page: 1,
      limit: 50,
      status: 'ENVIADA',
      motoboyId: 'motoboy-1',
    })
    expect(result.total).toBe(1)
  })

  it('bloqueia motoboy de listar pendentes', async () => {
    await expect(service.listPending(motoboyUser)).rejects.toBeInstanceOf(
      ForbiddenError,
    )
  })
})
