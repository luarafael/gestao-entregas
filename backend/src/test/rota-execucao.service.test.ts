import { beforeEach, describe, expect, it, vi } from 'vitest'

const rotaRepository = vi.hoisted(() => ({
  findById: vi.fn(),
  linkParadaEntrega: vi.fn(),
  markConcluded: vi.fn(),
}))

const rotaExecucaoRepository = vi.hoisted(() => ({
  initForRota: vi.fn(),
  updateByParadaId: vi.fn(),
  findByRotaId: vi.fn(),
  bulkSync: vi.fn(),
}))

const entregaRepository = vi.hoisted(() => ({
  markDelivered: vi.fn(),
  findByIds: vi.fn(),
  create: vi.fn(),
}))

vi.mock('../repositories/rota.repository.js', () => ({
  rotaRepository,
}))

vi.mock('../repositories/rota-execucao.repository.js', () => ({
  rotaExecucaoRepository,
}))

vi.mock('../repositories/entrega.repository.js', () => ({
  entregaRepository,
}))

vi.mock('../repositories/usuario.repository.js', () => ({
  usuarioRepository: {
    findById: vi.fn(),
  },
}))

vi.mock('../services/push-notification.service.js', () => ({
  pushNotificationService: {
    notifyAdminsDeliveryCompleted: vi.fn(),
  },
}))

import { rotaExecucaoService } from '../services/rota-execucao.service.js'

describe('RotaExecucaoService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    rotaExecucaoRepository.initForRota.mockResolvedValue([])
    rotaExecucaoRepository.updateByParadaId.mockResolvedValue({ count: 1 })
    rotaExecucaoRepository.findByRotaId.mockResolvedValue([])
    entregaRepository.findByIds.mockResolvedValue([])
    entregaRepository.create.mockResolvedValue({ id: 'entrega-nova' })
    entregaRepository.markDelivered.mockResolvedValue({})
    rotaRepository.linkParadaEntrega.mockResolvedValue({})
    rotaRepository.markConcluded.mockResolvedValue({})
  })

  it('atualiza horário da entrega ao marcar parada como entregue', async () => {
    rotaRepository.findById.mockResolvedValue({
      id: 'rota-1',
      motoboyId: 'm1',
      concluidaEm: null,
      paradas: [
        {
          id: 'p1',
          ordem: 1,
          entregaId: 'e1',
          endereco: 'Rua A',
          bairro: 'Centro',
          cliente: 'João',
          observacao: null,
          valorEntrega: 10,
        },
        {
          id: 'p2',
          ordem: 2,
          entregaId: 'e2',
          endereco: 'Rua B',
          bairro: 'Meireles',
          cliente: null,
          observacao: null,
          valorEntrega: 12,
        },
      ],
    })

    rotaExecucaoRepository.findByRotaId.mockResolvedValue([
      { paradaId: 'p1', status: 'ENTREGUE', dataHoraStatus: new Date() },
      { paradaId: 'p2', status: 'PENDENTE', dataHoraStatus: null },
    ])

    await rotaExecucaoService.updateParada('rota-1', 'p1', {
      status: 'ENTREGUE',
      observacao: null,
    })

    expect(rotaExecucaoRepository.updateByParadaId).toHaveBeenCalledWith(
      'rota-1',
      'p2',
      expect.objectContaining({ status: 'EM_ROTA' }),
    )
    expect(entregaRepository.markDelivered).toHaveBeenCalledWith(
      'e1',
      expect.any(Date),
    )
    expect(entregaRepository.create).not.toHaveBeenCalled()
  })

  it('nao promove proxima parada quando rota ja foi concluida', async () => {
    rotaRepository.findById.mockResolvedValue({
      id: 'rota-1',
      motoboyId: 'm1',
      concluidaEm: null,
      paradas: [
        {
          id: 'p1',
          ordem: 1,
          entregaId: 'e1',
          endereco: 'Rua A',
          bairro: 'Centro',
          cliente: 'João',
          observacao: null,
          valorEntrega: 10,
        },
      ],
    })

    rotaExecucaoRepository.findByRotaId.mockResolvedValue([
      { paradaId: 'p1', status: 'ENTREGUE', dataHoraStatus: new Date() },
    ])

    await rotaExecucaoService.updateParada('rota-1', 'p1', {
      status: 'ENTREGUE',
      observacao: null,
    })

    expect(rotaExecucaoRepository.updateByParadaId).toHaveBeenCalledTimes(1)
  })

  it('conclui entregas do motoboy quando todas as paradas forem entregues', async () => {
    const deliveredAt = new Date('2026-08-08T15:30:00.000Z')

    rotaRepository.findById.mockResolvedValue({
      id: 'rota-1',
      motoboyId: 'm1',
      concluidaEm: null,
      paradas: [
        {
          id: 'p1',
          entregaId: 'e1',
          endereco: 'Rua A',
          bairro: 'Centro',
          cliente: 'João',
          observacao: null,
          valorEntrega: 10,
        },
        {
          id: 'p2',
          entregaId: null,
          endereco: 'Rua B',
          bairro: 'Meireles',
          cliente: 'Maria',
          observacao: 'Portaria',
          valorEntrega: 15,
        },
      ],
    })

    entregaRepository.findByIds.mockResolvedValue([
      { id: 'e1', motoboyId: 'm1' },
    ])

    rotaExecucaoRepository.findByRotaId.mockResolvedValue([
      { paradaId: 'p1', status: 'ENTREGUE', dataHoraStatus: deliveredAt },
      { paradaId: 'p2', status: 'ENTREGUE', dataHoraStatus: deliveredAt },
    ])

    const result = await rotaExecucaoService.updateParada('rota-1', 'p2', {
      status: 'ENTREGUE',
      observacao: null,
    })

    expect(result.rotaConcluida).toBe(true)
    expect(rotaRepository.markConcluded).toHaveBeenCalledWith(
      'rota-1',
      deliveredAt,
    )
    expect(entregaRepository.markDelivered).toHaveBeenCalledWith('e1', deliveredAt)
    expect(entregaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        endereco: 'Rua B',
        bairro: 'Meireles',
        nomeCliente: 'Maria',
        observacao: 'Portaria',
        valorEntrega: 15,
      }),
      'm1',
    )
    expect(rotaRepository.linkParadaEntrega).toHaveBeenCalledWith(
      'p2',
      'entrega-nova',
    )
  })

  it('conclui a rota quando a ultima parada e entregue e as outras ja estavam entregues', async () => {
    const statusByParada: Record<string, string> = {
      p1: 'PENDENTE',
      p2: 'PENDENTE',
    }

    rotaRepository.findById.mockResolvedValue({
      id: 'rota-1',
      motoboyId: 'm1',
      concluidaEm: null,
      paradas: [
        {
          id: 'p1',
          entregaId: 'e1',
          endereco: 'Rua A',
          bairro: 'Centro',
          cliente: 'João',
          observacao: null,
          valorEntrega: 10,
        },
        {
          id: 'p2',
          entregaId: 'e2',
          endereco: 'Rua B',
          bairro: 'Meireles',
          cliente: 'Maria',
          observacao: null,
          valorEntrega: 12,
        },
      ],
    })

    entregaRepository.findByIds.mockResolvedValue([
      { id: 'e1', motoboyId: 'm1', status: 'ENTREGUE' },
      { id: 'e2', motoboyId: 'm1', status: 'ENTREGUE' },
    ])

    rotaExecucaoRepository.findByRotaId.mockImplementation(async () => [
      {
        paradaId: 'p1',
        status: statusByParada.p1,
        dataHoraStatus: null,
      },
      {
        paradaId: 'p2',
        status: statusByParada.p2,
        dataHoraStatus: new Date(),
      },
    ])
    rotaExecucaoRepository.updateByParadaId.mockImplementation(
      async (_rotaId, paradaId, data) => {
        statusByParada[paradaId] = data.status
        return { count: 1 }
      },
    )

    const result = await rotaExecucaoService.updateParada('rota-1', 'p2', {
      status: 'ENTREGUE',
      observacao: null,
    })

    expect(result.rotaConcluida).toBe(true)
    expect(statusByParada.p1).toBe('ENTREGUE')
    expect(statusByParada.p2).toBe('ENTREGUE')
    expect(rotaRepository.markConcluded).toHaveBeenCalled()
  })

  it('reconcilia rota legada já totalmente entregue', async () => {
    const deliveredAt = new Date('2026-08-08T15:30:00.000Z')

    rotaRepository.findById.mockResolvedValue({
      id: 'rota-legada',
      motoboyId: 'm1',
      concluidaEm: null,
      paradas: [
        {
          id: 'p1',
          entregaId: 'e1',
          endereco: 'Rua A',
          bairro: 'Centro',
          cliente: 'João',
          observacao: null,
          valorEntrega: 10,
        },
      ],
    })

    entregaRepository.findByIds.mockResolvedValue([
      { id: 'e1', motoboyId: 'm1' },
    ])

    rotaExecucaoRepository.findByRotaId.mockResolvedValue([
      { paradaId: 'p1', status: 'ENTREGUE', dataHoraStatus: deliveredAt },
    ])

    const result = await rotaExecucaoService.reconcileRouteConclusion('rota-legada')

    expect(result).toBe(true)
    expect(rotaRepository.markConcluded).toHaveBeenCalledWith(
      'rota-legada',
      deliveredAt,
    )
  })
})
