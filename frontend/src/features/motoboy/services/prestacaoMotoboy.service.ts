import { apiFetch } from '@/shared/services/api'
import type { PaginatedResponse } from '@/shared/types/api.types'
import type {
  PrestacaoMotoboy,
  PrestacaoMotoboyPreview,
  SubmitPrestacaoMotoboyResponse,
} from '../types/prestacaoMotoboy.types'
import type { SubmitPrestacaoMotoboyFormData } from '../schemas/prestacaoMotoboy.schema'
import { toSubmitPayload } from '../schemas/prestacaoMotoboy.schema'

export const prestacaoMotoboyService = {
  preview(date?: string, motoboyId?: string) {
    const params = new URLSearchParams()
    if (date) {
      params.set('data', date)
    }
    if (motoboyId) {
      params.set('motoboyId', motoboyId)
    }
    const query = params.toString()
    return apiFetch<PrestacaoMotoboyPreview>(
      `/api/prestacoes-motoboy/preview${query ? `?${query}` : ''}`,
    )
  },

  submit(data: SubmitPrestacaoMotoboyFormData) {
    return apiFetch<SubmitPrestacaoMotoboyResponse>('/api/prestacoes-motoboy', {
      method: 'POST',
      body: JSON.stringify(toSubmitPayload(data)),
    })
  },

  list(filters: {
    page: number
    limit: number
    status?: PrestacaoMotoboy['status']
    motoboyId?: string
  }) {
    const params = new URLSearchParams({
      page: String(filters.page),
      limit: String(filters.limit),
    })
    if (filters.status) {
      params.set('status', filters.status)
    }
    if (filters.motoboyId) {
      params.set('motoboyId', filters.motoboyId)
    }

    return apiFetch<PaginatedResponse<PrestacaoMotoboy>>(
      `/api/prestacoes-motoboy?${params.toString()}`,
    )
  },

  getWhatsAppText(id: string) {
    return apiFetch<{ text: string }>(
      `/api/prestacoes-motoboy/${id}/whatsapp`,
    )
  },
}
