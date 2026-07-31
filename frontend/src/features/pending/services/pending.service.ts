import { apiFetch } from '@/shared/services/api'
import type { PaginatedResponse, Pendencia } from '@/shared/types/api.types'
import type { PendingFilters, PendingFormData } from '../schemas/pending.schema'
import { toApiPayload } from '../schemas/pending.schema'

function buildQuery(filters: PendingFilters): string {
  const params = new URLSearchParams()

  params.set('page', String(filters.page))
  params.set('limit', String(filters.limit))

  if (filters.search.trim()) {
    params.set('search', filters.search.trim())
  }

  if (filters.status) {
    params.set('status', filters.status)
  }

  return params.toString()
}

export const pendingService = {
  list(filters: PendingFilters) {
    return apiFetch<PaginatedResponse<Pendencia>>(
      `/api/pendencias?${buildQuery(filters)}`,
    )
  },

  getById(id: string) {
    return apiFetch<Pendencia>(`/api/pendencias/${id}`)
  },

  create(data: PendingFormData) {
    return apiFetch<Pendencia>('/api/pendencias', {
      method: 'POST',
      body: JSON.stringify(toApiPayload(data)),
    })
  },

  update(id: string, data: PendingFormData) {
    return apiFetch<Pendencia>(`/api/pendencias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toApiPayload(data)),
    })
  },

  delete(id: string) {
    return apiFetch<void>(`/api/pendencias/${id}`, { method: 'DELETE' })
  },
}
