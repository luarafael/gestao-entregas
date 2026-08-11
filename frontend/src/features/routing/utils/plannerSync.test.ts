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

  it('limpa planejador quando rota salva foi concluida no servidor', async () => {
    usePlannerStore.setState({
      savedRotaId: 'rota-concluida',
      stops: [
        {
          tempId: 'parada-1',
          paradaId: 'parada-1',
          cliente: 'Cliente',
          endereco: 'Rua B',
          bairro: 'Centro',
          prioridade: 'NORMAL',
          ordem: 1,
          statusExecucao: 'PENDENTE',
        },
      ],
      result: {
        enderecoInicial: 'Rua A',
        distanciaTotal: 100,
        tempoTotal: 60,
        aproximada: false,
        paradas: [],
      } as never,
    })

    vi.mocked(routingService.getActiveToday).mockResolvedValue({ rota: null })
    vi.mocked(routingService.getById).mockResolvedValue({
      id: 'rota-concluida',
      concluidaEm: '2026-08-11T18:00:00.000Z',
      enderecoInicial: 'Rua A',
      distanciaTotal: 100,
      tempoTotal: 60,
      aproximada: false,
      paradas: [{ id: 'parada-1', ordem: 1 }],
    } as never)
    vi.mocked(routingService.getExecucao).mockResolvedValue([
      {
        paradaId: 'parada-1',
        status: 'ENTREGUE',
        observacao: null,
        dataHoraStatus: '2026-08-11T18:00:00.000Z',
      },
    ] as never)

    const result = await syncPlannerFromServer()

    expect(result).toBe('cleared')
    expect(usePlannerStore.getState().savedRotaId).toBeNull()
    expect(usePlannerStore.getState().stops).toHaveLength(0)
    expect(routingService.reconcileRouteConclusion).not.toHaveBeenCalled()
  })
})
