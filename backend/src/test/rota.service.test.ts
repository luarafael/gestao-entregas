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
})
