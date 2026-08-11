import { beforeEach, describe, expect, it, vi } from 'vitest'
import { routingService } from '../services/routing.service'
import { usePlannerStore } from '../stores/planner.store'
import { syncPlannerFromServer } from './plannerSync'

vi.mock('../services/routing.service', () => ({
  routingService: {
    getActiveToday: vi.fn(),
    getById: vi.fn(),
    getExecucao: vi.fn(),
    reconcileRouteConclusion: vi.fn(),
  },
}))

describe('syncPlannerFromServer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePlannerStore.setState({
      stops: [],
      result: null,
      savedRotaId: null,
      reorderLocked: false,
      orderDirty: false,
      autoRecalc: true,
      historicoExecucao: [],
      progressUpdatedAt: new Date().toISOString(),
      tab: 'planejar',
      selectedTempId: null,
    })
  })

  it('hidrata rota ativa do servidor quando não há estado local', async () => {
    vi.mocked(routingService.getActiveToday).mockResolvedValue({
      rota: {
        id: 'rota-1',
        enderecoInicial: 'Rua A',
        distanciaTotal: 100,
        tempoTotal: 60,
        aproximada: false,
        paradas: [
          {
            id: 'parada-1',
            entregaId: null,
            cliente: 'Cliente',
            endereco: 'Rua B',
            bairro: 'Centro',
            telefone: null,
            observacao: null,
            prioridade: 'NORMAL',
            ordemUrgencia: null,
            valorEntrega: null,
            ordem: 1,
            distancia: null,
            tempo: null,
            latitude: null,
            longitude: null,
          },
        ],
      } as never,
    })
    vi.mocked(routingService.getExecucao).mockResolvedValue([])

    const result = await syncPlannerFromServer()

    expect(result).toBe('hydrated-active')
    expect(usePlannerStore.getState().savedRotaId).toBe('rota-1')
    expect(usePlannerStore.getState().stops).toHaveLength(1)
  })

  it('preserva rascunho local sem rota salva', async () => {
    usePlannerStore.setState({
      stops: [
        {
          tempId: 'tmp-1',
          cliente: 'Cliente',
          endereco: 'Rua B',
          bairro: 'Centro',
          prioridade: 'NORMAL',
          ordem: 1,
        },
      ],
    })

    const result = await syncPlannerFromServer()

    expect(result).toBe('draft-kept')
    expect(routingService.getActiveToday).not.toHaveBeenCalled()
  })
})
