import { apiFetch } from '@/shared/services/api'
import type { PaginatedResponse } from '@/shared/types/api.types'
import type {
  OptimizedRouteResult,
  PlannerStop,
  RotaPlanejada,
} from '../schemas/routing.schema'

export const routingService = {
  optimize(enderecoInicial: string, paradas: PlannerStop[]) {
    return apiFetch<OptimizedRouteResult>('/api/rotas/optimize', {
      method: 'POST',
      body: JSON.stringify({ enderecoInicial, paradas }),
    })
  },

  save(payload: {
    enderecoInicial: string
    distanciaTotal: number
    tempoTotal: number
    aproximada: boolean
    paradas: PlannerStop[]
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
    return apiFetch<unknown>(`/api/rotas/${rotaId}/execucao/paradas/${paradaId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },
}
