import { apiFetch } from '@/shared/services/api'
import { getTodayInputDate } from '@/shared/utils/date'
import type { Entrega, PaginatedResponse } from '@/shared/types/api.types'
import type {
  DeliveryClienteFormData,
  DeliveryFilters,
  DeliveryMotoboyFormData,
  DeliveryViewMode,
} from '../schemas/delivery.schema'

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

  if (filters.nomeCliente) {
    params.set('nomeCliente', filters.nomeCliente)
  }

  if (filters.apenasComCliente) {
    params.set('apenasComCliente', 'true')
  }

  return params.toString()
}

function toMotoboyApiPayload(data: DeliveryMotoboyFormData) {
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

function toClienteApiPayload(data: DeliveryClienteFormData) {
  return {
    nomeCliente: data.nomeCliente,
    endereco: data.endereco,
    bairro: data.bairro,
    cidade: data.cidade,
    valorProduto: data.valorProduto,
    formaPagamento: data.formaPagamento,
    valorEntrega: data.valorEntrega,
    observacao: data.observacao,
    pagoPeloCliente: false,
    ...(data.motoboyId ? { motoboyId: data.motoboyId } : {}),
  }
}

export const deliveryService = {
  list(filters: DeliveryFilters) {
    return apiFetch<PaginatedResponse<Entrega>>(`/api/entregas?${buildQuery(filters)}`)
  },

  listClientes(filters: Pick<DeliveryFilters, 'filter'>) {
    const params = new URLSearchParams()
    params.set('page', '1')
    params.set('limit', '1')
    params.set('filter', filters.filter)
    if (filters.filter === 'today') {
      params.set('referenceDate', getTodayInputDate())
    }
    return apiFetch<{ clientes: string[] }>(`/api/entregas/clientes?${params.toString()}`)
  },

  getById(id: string) {
    return apiFetch<Entrega>(`/api/entregas/${id}`)
  },

  create(viewMode: DeliveryViewMode, data: DeliveryMotoboyFormData | DeliveryClienteFormData) {
    const body =
      viewMode === 'cliente'
        ? toClienteApiPayload(data as DeliveryClienteFormData)
        : toMotoboyApiPayload(data as DeliveryMotoboyFormData)

    return apiFetch<Entrega>('/api/entregas', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  update(
    viewMode: DeliveryViewMode,
    id: string,
    data: DeliveryMotoboyFormData | DeliveryClienteFormData,
  ) {
    const body =
      viewMode === 'cliente'
        ? toClienteApiPayload(data as DeliveryClienteFormData)
        : toMotoboyApiPayload(data as DeliveryMotoboyFormData)

    return apiFetch<Entrega>(`/api/entregas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  },

  delete(id: string) {
    return apiFetch<void>(`/api/entregas/${id}`, { method: 'DELETE' })
  },
}
