import { apiFetch } from '@/shared/services/api'
import type { PaginatedResponse } from '@/shared/types/api.types'
import type {
  GeneratePrestacaoResponse,
  PrestacaoContas,
  PrestacaoFilters,
} from '../types'
import type { GeneratePrestacaoFormData } from '../schemas/prestacao.schema'
import { toGeneratePayload } from '../schemas/prestacao.schema'

export const prestacaoService = {
  list(filters: PrestacaoFilters) {
    const params = new URLSearchParams({
      page: String(filters.page),
      limit: String(filters.limit),
    })

    return apiFetch<PaginatedResponse<PrestacaoContas>>(
      `/api/prestacoes?${params.toString()}`,
    )
  },

  generate(data: GeneratePrestacaoFormData) {
    return apiFetch<GeneratePrestacaoResponse>('/api/prestacoes/generate', {
      method: 'POST',
      body: JSON.stringify(toGeneratePayload(data)),
    })
  },

  getWhatsAppText(id: string) {
    return apiFetch<{ text: string }>(`/api/prestacoes/${id}/whatsapp`)
  },

  update(
    id: string,
    data: { observacoes?: string | null; recalcular?: boolean },
  ) {
    return apiFetch<PrestacaoContas>(`/api/prestacoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete(id: string) {
    return apiFetch<void>(`/api/prestacoes/${id}`, { method: 'DELETE' })
  },
}
