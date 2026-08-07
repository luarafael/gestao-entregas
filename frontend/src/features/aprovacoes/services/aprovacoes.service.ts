import { apiFetch } from '@/shared/services/api'
import type { PaginatedResponse } from '@/shared/types/api.types'
import type { PrestacaoMotoboy } from '@/features/motoboy/types/prestacaoMotoboy.types'

export const aprovacoesService = {
  listPending(motoboyId?: string) {
    const query = motoboyId
      ? `?motoboyId=${encodeURIComponent(motoboyId)}`
      : ''
    return apiFetch<{ data: PrestacaoMotoboy[]; total: number }>(
      `/api/prestacoes-motoboy/pendentes${query}`,
    )
  },

  countPending() {
    return apiFetch<{ total: number }>('/api/prestacoes-motoboy/pendentes/count')
  },

  approve(id: string) {
    return apiFetch<PrestacaoMotoboy>(
      `/api/prestacoes-motoboy/${id}/aprovar`,
      { method: 'POST' },
    )
  },

  reject(id: string, motivoRejeicao: string) {
    return apiFetch<PrestacaoMotoboy>(
      `/api/prestacoes-motoboy/${id}/rejeitar`,
      {
        method: 'POST',
        body: JSON.stringify({ motivoRejeicao }),
      },
    )
  },

  getWhatsAppText(id: string) {
    return apiFetch<{ text: string }>(
      `/api/prestacoes-motoboy/${id}/whatsapp`,
    )
  },

  listHistory(params: {
    page?: number
    limit?: number
    motoboyId?: string
  }) {
    const search = new URLSearchParams()
    search.set('historico', 'true')
    search.set('page', String(params.page ?? 1))
    search.set('limit', String(params.limit ?? 20))
    if (params.motoboyId) {
      search.set('motoboyId', params.motoboyId)
    }
    return apiFetch<PaginatedResponse<PrestacaoMotoboy>>(
      `/api/prestacoes-motoboy?${search.toString()}`,
    )
  },
}
