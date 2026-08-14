import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConflictError, ValidationError } from '../errors/app.error.js'
import type { AuthenticatedUser } from '../middleware/auth.middleware.js'
import { RotaService } from '../services/rota.service.js'

vi.mock('../repositories/rota.repository.js', () => ({
  rotaRepository: {
    create: vi.fn(),
    findByDateWithExecucoes: vi.fn(),
    delete: vi.fn(),
    findById: vi.fn(),
    getEnderecoPartidaPadrao: vi.fn(),
    findActiveToday: vi.fn(),
    findActiveForMotoboyToday: vi.fn(),
    findConcludedSince: vi.fn(),
  },
}))

vi.mock('../repositories/rota-execucao.repository.js', () => ({
  rotaExecucaoRepository: {
    initForRota: vi.fn(),
  },
}))

vi.mock('../repositories/entrega.repository.js', () => ({
  entregaRepository: {
    findByIds: vi.fn(),
  },
}))

vi.mock('../services/googleRoutes.service.js', () => ({
  googleRoutesService: {
    geocode: vi.fn(),
    geocodeMany: vi.fn(),
    computeRouteMatrix: vi.fn(),
    computeOptimizedRoute: vi.fn(),
  },
}))

vi.mock('../services/osrm.service.js', () => ({
  osrmService: {
    computeRouteMatrix: vi.fn(),
    computeRoutePolyline: vi.fn(),
    computeRouteLegs: vi.fn(),
  },
}))

vi.mock('../services/push-notification.service.js', () => ({
  pushNotificationService: {
    notifyMotoboyNewRoute: vi.fn(),
  },
}))

import { entregaRepository } from '../repositories/entrega.repository.js'
import { rotaExecucaoRepository } from '../repositories/rota-execucao.repository.js'
import { rotaRepository } from '../repositories/rota.repository.js'

const motoboyUser: AuthenticatedUser = {
  id: 'motoboy-1',
  email: 'motoboy@test.com',
  role: 'MOTOBOY',
}

const adminUser: AuthenticatedUser = {
  id: 'admin-1',
  email: 'admin@test.com',
  role: 'ADMIN',
}

const savePayload = {
  enderecoInicial: 'Rua A, 1',
  distanciaTotal: 1000,
  tempoTotal: 600,
  aproximada: false,
  paradas: [
    {
      tempId: 'p1',
      entregaId: 'e1',
      endereco: 'Rua B, 2',
      prioridade: 'NORMAL' as const,
      ordem: 1,
    },
  ],
}

describe('RotaService motoboy slot', () => {
  const service = new RotaService()

  beforeEach(() => {
    vi.clearAllMocks()
    entregaRepository.findByIds.mockResolvedValue([
      { id: 'e1', motoboyId: 'motoboy-1' },
    ])
    rotaRepository.create.mockResolvedValue({
      id: 'rota-nova',
      paradas: [{ id: 'parada-1', ordem: 1, endereco: 'Rua B, 2', cliente: null }],
    })
    rotaExecucaoRepository.initForRota.mockResolvedValue([])
    rotaRepository.findByDateWithExecucoes.mockResolvedValue([])
  })

  it('bloqueia segunda rota ativa com progresso para o mesmo motoboy', async () => {
    rotaRepository.findByDateWithExecucoes.mockResolvedValue([
      {
        id: 'rota-antiga',
        motoboyId: 'motoboy-1',
        paradas: [{ entregaId: 'e1' }],
        execucoes: [{ status: 'EM_ROTA' }],
      },
    ])

    await expect(service.save(motoboyUser, savePayload)).rejects.toBeInstanceOf(
      ConflictError,
    )
    expect(rotaRepository.create).not.toHaveBeenCalled()
  })

  it('substitui rota anterior sem progresso ao recalcular', async () => {
    rotaRepository.findByDateWithExecucoes.mockResolvedValue([
      {
        id: 'rota-antiga',
        motoboyId: 'motoboy-1',
        paradas: [{ entregaId: 'e1' }],
        execucoes: [{ status: 'PENDENTE' }],
      },
    ])

    await service.save(motoboyUser, {
      ...savePayload,
      substituirRotaId: 'rota-antiga',
    })

    expect(rotaRepository.delete).toHaveBeenCalledWith('rota-antiga')
    expect(rotaRepository.create).toHaveBeenCalled()
  })

  it('não substitui rota já concluída ao recalcular', async () => {
    rotaRepository.findByDateWithExecucoes.mockResolvedValue([
      {
        id: 'rota-concluida',
        motoboyId: 'motoboy-1',
        paradas: [{ entregaId: 'e1' }],
        execucoes: [{ status: 'ENTREGUE' }],
      },
    ])

    await service.save(motoboyUser, {
      ...savePayload,
      substituirRotaId: 'rota-concluida',
    })

    expect(rotaRepository.delete).not.toHaveBeenCalledWith('rota-concluida')
    expect(rotaRepository.create).toHaveBeenCalled()
  })

  it('rejeita rota admin com entregas de motoboys diferentes', async () => {
    entregaRepository.findByIds.mockResolvedValue([
      { id: 'e1', motoboyId: 'motoboy-1' },
      { id: 'e2', motoboyId: 'motoboy-2' },
    ])

    await expect(
      service.save(adminUser, {
        ...savePayload,
        paradas: [
          ...savePayload.paradas,
          {
            tempId: 'p2',
            entregaId: 'e2',
            endereco: 'Rua C, 3',
            prioridade: 'NORMAL' as const,
            ordem: 2,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('usa motoboyId explícito quando admin informa no save', async () => {
    await service.save(adminUser, {
      ...savePayload,
      motoboyId: 'motoboy-2',
    })

    expect(rotaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ motoboyId: 'motoboy-2' }),
    )
  })
})

describe('RotaService getActiveToday', () => {
  const service = new RotaService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna rota ativa do dia para admin', async () => {
    rotaRepository.findActiveToday.mockResolvedValue({ id: 'rota-admin' })

    const result = await service.getActiveToday(adminUser)

    expect(rotaRepository.findActiveToday).toHaveBeenCalled()
    expect(result.rota?.id).toBe('rota-admin')
  })

  it('retorna rota ativa do motoboy no dia', async () => {
    rotaRepository.findActiveForMotoboyToday.mockResolvedValue({
      id: 'rota-motoboy',
    })

    const result = await service.getActiveToday(motoboyUser)

    expect(rotaRepository.findActiveForMotoboyToday).toHaveBeenCalledWith(
      'motoboy-1',
      expect.any(Date),
    )
    expect(result.rota?.id).toBe('rota-motoboy')
  })
})

describe('RotaService delete', () => {
  const service = new RotaService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('permite motoboy excluir a propria rota', async () => {
    rotaRepository.findById.mockResolvedValue({
      id: 'rota-1',
      motoboyId: 'motoboy-1',
      paradas: [],
    })
    rotaRepository.delete.mockResolvedValue({ id: 'rota-1' })

    await service.delete(motoboyUser, 'rota-1')

    expect(rotaRepository.delete).toHaveBeenCalledWith('rota-1')
  })

  it('impede motoboy de excluir rota de outro', async () => {
    rotaRepository.findById.mockResolvedValue({
      id: 'rota-2',
      motoboyId: 'motoboy-2',
      paradas: [],
    })

    await expect(service.delete(motoboyUser, 'rota-2')).rejects.toMatchObject({
      statusCode: 403,
    })
    expect(rotaRepository.delete).not.toHaveBeenCalled()
  })
})

describe('RotaService eventos de conclusao', () => {
  const service = new RotaService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lista rotas concluidas para o admin', async () => {
    const since = new Date('2026-08-14T12:00:00.000Z')
    rotaRepository.findConcludedSince.mockResolvedValue([
      {
        id: 'rota-1',
        motoboyId: 'motoboy-1',
        enderecoInicial: 'Rua A',
        concluidaEm: new Date('2026-08-14T15:00:00.000Z'),
        _count: { paradas: 3 },
        motoboy: { id: 'motoboy-1', nome: 'João' },
      },
    ])

    const eventos = await service.getEventosConclusao(adminUser, since)

    expect(rotaRepository.findConcludedSince).toHaveBeenCalledWith(since)
    expect(eventos).toEqual([
      expect.objectContaining({
        id: 'rota-1',
        motoboyNome: 'João',
        totalParadas: 3,
        concluidaEm: '2026-08-14T15:00:00.000Z',
      }),
    ])
  })

  it('bloqueia motoboy de ver eventos de conclusao', async () => {
    await expect(
      service.getEventosConclusao(motoboyUser, new Date()),
    ).rejects.toMatchObject({ statusCode: 403 })
    expect(rotaRepository.findConcludedSince).not.toHaveBeenCalled()
  })
})
