import { apiFetch } from '@/shared/services/api'
import { getTodayInputDate } from '@/shared/utils/date'
import type { Entrega, PaginatedResponse } from '@/shared/types/api.types'
import type { DeliveryFilters, DeliveryFormData } from '../schemas/delivery.schema'

function buildQuery(filters: DeliveryFilters): string {
  const params = new URLSearchParams()

  params.set('page', String(filters.page))
  params.set('limit', String(filters.limit))
  params.set('filter', filters.filter)
  params.set('sortBy', filters.sortBy)
  params.set('sortOrder', filters.sortOrder)

  if (filters.filter === 'today') {
    params.set('referenceDate', getTodayInputDate())
  }

  if (filters.search.trim()) {
    params.set('search', filters.search.trim())
  }

  if (filters.motoboyId) {
    params.set('motoboyId', filters.motoboyId)
  }

  return params.toString()
}

function toApiPayload(data: DeliveryFormData) {
  return {
    nomeCliente: data.nomeCliente,
    endereco: data.endereco,
    bairro: data.bairro,
    cidade: data.cidade,
    valorEntrega: data.valorEntrega,
    observacao: data.observacao,
    pagoPeloCliente: data.pagoPeloCliente ?? false,
    ...(data.motoboyId ? { motoboyId: data.motoboyId } : {}),
  }
}

export const deliveryService = {
  list(filters: DeliveryFilters) {
    return apiFetch<PaginatedResponse<Entrega>>(`/api/entregas?${buildQuery(filters)}`)
  },

  getById(id: string) {
    return apiFetch<Entrega>(`/api/entregas/${id}`)
  },

  create(data: DeliveryFormData) {
    return apiFetch<Entrega>('/api/entregas', {
      method: 'POST',
      body: JSON.stringify(toApiPayload(data)),
    })
  },

  update(id: string, data: DeliveryFormData) {
    return apiFetch<Entrega>(`/api/entregas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toApiPayload(data)),
    })
  },

  delete(id: string) {
    return apiFetch<void>(`/api/entregas/${id}`, { method: 'DELETE' })
  },
}
