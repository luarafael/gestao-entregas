import { apiFetch } from '@/shared/services/api'
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
}
