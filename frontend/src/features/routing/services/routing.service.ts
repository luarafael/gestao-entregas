import { apiFetch } from '@/shared/services/api'
import type { PaginatedResponse } from '@/shared/types/api.types'
import type {
  OptimizedRouteResult,
  PlannerStop,
  RotaPlanejada,
} from '../schemas/routing.schema'

export const routingService = {
  optimize(
    enderecoInicial: string,
    paradas: PlannerStop[],
    options?: { preservarOrdem?: boolean },
  ) {
    return apiFetch<OptimizedRouteResult>('/api/rotas/optimize', {
      method: 'POST',
      body: JSON.stringify({
        enderecoInicial,
        paradas,
        preservarOrdem: options?.preservarOrdem ?? false,
      }),
    })
  },

  planRoute(
    enderecoInicial: string,
    paradas: PlannerStop[],
    options?: {
      preservarOrdem?: boolean
      substituirRotaId?: string | null
      motoboyId?: string | null
    },
  ) {
    return apiFetch<OptimizedRouteResult>('/api/rotas/planejar', {
      method: 'POST',
      body: JSON.stringify({
        enderecoInicial,
        paradas,
        preservarOrdem: options?.preservarOrdem ?? false,
        substituirRotaId: options?.substituirRotaId ?? null,
        motoboyId: options?.motoboyId ?? null,
      }),
    })
  },

  save(payload: {
    enderecoInicial: string
    distanciaTotal: number
    tempoTotal: number
    aproximada: boolean
    paradas: PlannerStop[]
    substituirRotaId?: string | null
    motoboyId?: string | null
  }) {
    return apiFetch<RotaPlanejada>('/api/rotas', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  list(page = 1, limit = 10) {
    return apiFetch<PaginatedResponse<RotaPlanejada>>(
      `/api/rotas?page=${page}&limit=${limit}`,
    )
  },

  getById(id: string) {
    return apiFetch<RotaPlanejada>(`/api/rotas/${id}`)
  },

  duplicate(id: string) {
    return apiFetch<RotaPlanejada>(`/api/rotas/${id}/duplicate`, {
      method: 'POST',
    })
  },

  delete(id: string) {
    return apiFetch<void>(`/api/rotas/${id}`, { method: 'DELETE' })
  },

  findByEntrega(entregaId: string) {
    return apiFetch<
      Array<{
        id: string
        rotaId: string
        rota: { id: string; data: string; enderecoInicial: string }
      }>
    >(`/api/rotas/by-entrega/${entregaId}`)
  },

  syncEntrega(payload: {
    entregaId: string
    cliente?: string | null
    endereco: string
    bairro?: string | null
    observacao?: string | null
    valorEntrega?: number | null
  }) {
    return apiFetch<{ count: number }>('/api/rotas/sync-entrega', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  reconcileRouteConclusion(rotaId: string) {
    return apiFetch<{ rotaConcluida: boolean }>(
      `/api/rotas/${rotaId}/reconciliar-conclusao`,
      { method: 'POST' },
    )
  },

  getActiveToday() {
    return apiFetch<{ rota: RotaPlanejada | null }>('/api/rotas/ativa-hoje')
  },

  getEnderecoPartida() {
    return apiFetch<{ enderecoPartidaPadrao: string }>(
      '/api/rotas/config/endereco-partida',
    )
  },

  updateEnderecoPartida(enderecoPartidaPadrao: string) {
    return apiFetch<{
      enderecoPartidaPadrao: string
      atualizadoEm: string
    }>('/api/rotas/config/endereco-partida', {
      method: 'PUT',
      body: JSON.stringify({ enderecoPartidaPadrao }),
    })
  },

  getExecucao(rotaId: string) {
    return apiFetch<
      Array<{
        id: string
        rotaId: string
        paradaId: string | null
        entregaId: string | null
        ordem: number
        status: string
        dataHoraStatus: string | null
        observacao: string | null
      }>
    >(`/api/rotas/${rotaId}/execucao`)
  },

  updateExecucaoParada(
    rotaId: string,
    paradaId: string,
    payload: { status: string; observacao?: string | null },
  ) {
    return apiFetch<{
      execucoes: Array<{
        id: string
        rotaId: string
        paradaId: string | null
        entregaId: string | null
        ordem: number
        status: string
        dataHoraStatus: string | null
        observacao: string | null
      }>
      rotaConcluida: boolean
    }>(`/api/rotas/${rotaId}/execucao/paradas/${paradaId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  bulkSyncExecucao(
    rotaId: string,
    paradas: Array<{
      paradaId: string
      status: string
      observacao?: string | null
    }>,
  ) {
    return apiFetch<{
      count: number
      execucoes: Array<{
        id: string
        rotaId: string
        paradaId: string | null
        entregaId: string | null
        ordem: number
        status: string
        dataHoraStatus: string | null
        observacao: string | null
      }>
      rotaConcluida: boolean
    }>(`/api/rotas/${rotaId}/execucao/sync`, {
      method: 'PUT',
      body: JSON.stringify({ paradas }),
    })
  },

  getEventos(since: string) {
    const params = new URLSearchParams({ since })
    return apiFetch<{
      eventos: Array<{
        id: string
        motoboyId: string | null
        totalParadas: number
        enderecoInicial: string
        criadoEm: string
      }>
    }>(`/api/rotas/eventos?${params.toString()}`)
  },

  getEventosConclusao(since: string) {
    const params = new URLSearchParams({ since })
    return apiFetch<{
      eventos: Array<{
        id: string
        motoboyId: string | null
        motoboyNome: string
        totalParadas: number
        enderecoInicial: string
        concluidaEm: string
      }>
    }>(`/api/rotas/eventos-conclusao?${params.toString()}`)
  },
}
