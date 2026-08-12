import { apiFetch } from '@/shared/services/api'
import type { PaginatedResponse } from '@/shared/types/api.types'
import type { AdminUser } from '../types'
import type { AdminFilters, AdminFormData } from '../schemas/admin.schema'
import { toCreatePayload, toUpdatePayload } from '../schemas/admin.schema'

function buildQuery(filters: AdminFilters): string {
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

export const adminService = {
  list(filters: AdminFilters) {
    return apiFetch<PaginatedResponse<AdminUser>>(
      `/api/usuarios/admins?${buildQuery(filters)}`,
    )
  },

  create(data: AdminFormData) {
    return apiFetch<AdminUser>('/api/usuarios/admins', {
      method: 'POST',
      body: JSON.stringify(toCreatePayload(data)),
    })
  },

  update(id: string, data: AdminFormData) {
    return apiFetch<AdminUser>(`/api/usuarios/admins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toUpdatePayload(data)),
    })
  },

  setAtivo(id: string, ativo: boolean) {
    return apiFetch<AdminUser>(`/api/usuarios/admins/${id}/ativo`, {
      method: 'PATCH',
      body: JSON.stringify({ ativo }),
    })
  },

  delete(id: string) {
    return apiFetch<void>(`/api/usuarios/admins/${id}`, {
      method: 'DELETE',
    })
  },
}
