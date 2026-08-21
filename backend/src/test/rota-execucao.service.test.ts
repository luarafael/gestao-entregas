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
    notifyAdminsRouteCompleted: vi.fn(),
  },
}))

import { rotaExecucaoService } from '../services/rota-execucao.service.js'
import { pushNotificationService } from '../services/push-notification.service.js'

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

  it('promove a proxima parada para em rota e nao conclui ao entregar uma parada intermediaria', async () => {
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
          cliente: 'Maria',
          observacao: null,
          valorEntrega: 12,
        },
      ],
    })

    rotaExecucaoRepository.findByRotaId.mockImplementation(async () => [
      {
        paradaId: 'p1',
        status: statusByParada.p1,
        dataHoraStatus: null,
      },
      {
        paradaId: 'p2',
        status: statusByParada.p2,
        dataHoraStatus: null,
      },
    ])
    rotaExecucaoRepository.updateByParadaId.mockImplementation(
      async (_rotaId, paradaId, data) => {
        statusByParada[paradaId] = data.status
        return { count: 1 }
      },
    )

    const result = await rotaExecucaoService.updateParada('rota-1', 'p1', {
      status: 'ENTREGUE',
      observacao: null,
    })

    expect(result.rotaConcluida).toBe(false)
    expect(statusByParada.p1).toBe('ENTREGUE')
    expect(statusByParada.p2).toBe('EM_ROTA')
    expect(rotaRepository.markConcluded).not.toHaveBeenCalled()
  })

  it('nao conclui a rota ao sair de pendente para em rota', async () => {
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
          cliente: 'Maria',
          observacao: null,
          valorEntrega: 12,
        },
      ],
    })

    rotaExecucaoRepository.findByRotaId.mockResolvedValue([
      { paradaId: 'p1', status: 'EM_ROTA', dataHoraStatus: new Date() },
      { paradaId: 'p2', status: 'PENDENTE', dataHoraStatus: null },
    ])

    const result = await rotaExecucaoService.updateParada('rota-1', 'p1', {
      status: 'EM_ROTA',
      observacao: null,
    })

    expect(result.rotaConcluida).toBe(false)
    expect(rotaRepository.markConcluded).not.toHaveBeenCalled()
  })

  it('conclui a rota somente quando a ultima parada e entregue', async () => {
    const statusByParada: Record<string, string> = {
      p1: 'ENTREGUE',
      p2: 'EM_ROTA',
    }

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
          cliente: 'Maria',
          observacao: null,
          valorEntrega: 12,
        },
      ],
    })

    entregaRepository.findByIds.mockResolvedValue([
      { id: 'e1', motoboyId: 'm1' },
      { id: 'e2', motoboyId: 'm1' },
    ])

    rotaExecucaoRepository.findByRotaId.mockImplementation(async () => [
      {
        paradaId: 'p1',
        status: statusByParada.p1,
        dataHoraStatus: new Date(),
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
    expect(pushNotificationService.notifyAdminsRouteCompleted).toHaveBeenCalledWith(
      expect.objectContaining({
        rotaId: 'rota-1',
        totalParadas: 2,
      }),
    )
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

  it('notifica admins ao entregar mesmo sem motoboy na rota', async () => {
    rotaRepository.findById.mockResolvedValue({
      id: 'rota-1',
      motoboyId: null,
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

    rotaExecucaoRepository.findByRotaId
      .mockResolvedValueOnce([
        { paradaId: 'p1', status: 'PENDENTE', dataHoraStatus: null },
      ])
      .mockResolvedValue([
        { paradaId: 'p1', status: 'ENTREGUE', dataHoraStatus: new Date() },
      ])

    await rotaExecucaoService.updateParada('rota-1', 'p1', {
      status: 'ENTREGUE',
      observacao: null,
    })

    await vi.waitFor(() => {
      expect(
        pushNotificationService.notifyAdminsDeliveryCompleted,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          execucaoId: 'rota-1-p1',
          motoboyNome: 'Motoboy',
          cliente: 'João',
        }),
      )
    })
  })

  it('preserva horário das entregas já concluídas no bulkSync', async () => {
    const originalAt = new Date('2026-08-05T15:10:00.000Z')

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
          cliente: 'Maria',
          observacao: null,
          valorEntrega: 12,
        },
      ],
    })
    rotaExecucaoRepository.findByRotaId.mockResolvedValue([
      {
        paradaId: 'p1',
        status: 'ENTREGUE',
        dataHoraStatus: originalAt,
        observacao: null,
      },
      {
        paradaId: 'p2',
        status: 'PENDENTE',
        dataHoraStatus: null,
        observacao: null,
      },
    ])
    rotaExecucaoRepository.bulkSync.mockResolvedValue(2)

    await rotaExecucaoService.bulkSync('rota-1', {
      paradas: [
        { paradaId: 'p1', status: 'ENTREGUE' },
        { paradaId: 'p2', status: 'ENTREGUE' },
      ],
    })

    expect(rotaExecucaoRepository.bulkSync).toHaveBeenCalledWith(
      'rota-1',
      [
        expect.objectContaining({
          paradaId: 'p1',
          status: 'ENTREGUE',
          dataHoraStatus: originalAt,
        }),
        expect.objectContaining({
          paradaId: 'p2',
          status: 'ENTREGUE',
          dataHoraStatus: expect.any(Date),
        }),
      ],
    )
    expect(entregaRepository.markDelivered).toHaveBeenCalledWith('e1', originalAt)
    expect(pushNotificationService.notifyAdminsDeliveryCompleted).not.toHaveBeenCalled()
  })
})
