import { apiFetch } from '@/shared/services/api'
import type { PaginatedResponse } from '@/shared/types/api.types'
import type { Motoboy } from '../types'
import type { MotoboyFilters, MotoboyFormData } from '../schemas/motoboy.schema'
import { toCreatePayload, toUpdatePayload } from '../schemas/motoboy.schema'

function buildQuery(filters: MotoboyFilters): string {
  const params = new URLSearchParams()

  params.set('page', String(filters.page))
  params.set('limit', String(filters.limit))

  if (filters.search.trim()) {
    params.set('search', filters.search.trim())
  }

  if (filters.ativo && filters.ativo !== 'all') {
    params.set('ativo', filters.ativo)
  }

  return params.toString()
}

export const motoboyService = {
  list(filters: MotoboyFilters) {
    return apiFetch<PaginatedResponse<Motoboy>>(
      `/api/usuarios/motoboys?${buildQuery(filters)}`,
    )
  },

  create(data: MotoboyFormData) {
    return apiFetch<Motoboy>('/api/usuarios/motoboys', {
      method: 'POST',
      body: JSON.stringify(toCreatePayload(data)),
    })
  },

  update(id: string, data: MotoboyFormData) {
    return apiFetch<Motoboy>(`/api/usuarios/motoboys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toUpdatePayload(data)),
    })
  },

  setAtivo(id: string, ativo: boolean) {
    return apiFetch<Motoboy>(`/api/usuarios/motoboys/${id}/ativo`, {
      method: 'PATCH',
      body: JSON.stringify({ ativo }),
    })
  },

  delete(id: string) {
    return apiFetch<void>(`/api/usuarios/motoboys/${id}`, {
      method: 'DELETE',
    })
  },
}
