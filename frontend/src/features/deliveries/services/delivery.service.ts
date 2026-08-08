import { apiFetch } from '@/shared/services/api'
import { getTodayInputDate } from '@/shared/utils/date'
import type { Entrega, PaginatedResponse } from '@/shared/types/api.types'
import type {
  DeliveryClienteFormData,
  DeliveryFilters,
  DeliveryMotoboyFormData,
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

  if (filters.origemCadastro) {
    params.set('origemCadastro', filters.origemCadastro)
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
    telefoneCliente: data.telefoneCliente,
    endereco: data.endereco,
    valorProduto: data.valorProduto,
    formaPagamento: data.formaPagamento,
    statusPagamento: data.statusPagamento,
    valorEntregaMotoboy: data.valorEntregaMotoboy,
    valorEntrega: data.valorEntrega,
    observacao: data.observacao,
    cidade: data.cidade,
  }
}

export const deliveryService = {
  list(filters: DeliveryFilters) {
    return apiFetch<PaginatedResponse<Entrega>>(`/api/entregas?${buildQuery(filters)}`)
  },

  listByIds(ids: string[]) {
    return apiFetch<{ data: Entrega[] }>('/api/entregas/por-ids', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    })
  },

  updatePaymentStatus(id: string, statusPagamento: 'PAGO' | 'NAO_PAGO') {
    return apiFetch<Entrega>(`/api/entregas/${id}/status-pagamento`, {
      method: 'PATCH',
      body: JSON.stringify({ statusPagamento }),
    })
  },

  getById(id: string) {
    return apiFetch<Entrega>(`/api/entregas/${id}`)
  },

  createMotoboy(data: DeliveryMotoboyFormData) {
    return apiFetch<Entrega>('/api/entregas', {
      method: 'POST',
      body: JSON.stringify(toMotoboyApiPayload(data)),
    })
  },

  updateMotoboy(id: string, data: DeliveryMotoboyFormData) {
    return apiFetch<Entrega>(`/api/entregas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toMotoboyApiPayload(data)),
    })
  },

  createCliente(data: DeliveryClienteFormData) {
    return apiFetch<Entrega>('/api/entregas/cliente', {
      method: 'POST',
      body: JSON.stringify(toClienteApiPayload(data)),
    })
  },

  updateCliente(id: string, data: DeliveryClienteFormData) {
    return apiFetch<Entrega>(`/api/entregas/cliente/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toClienteApiPayload(data)),
    })
  },

  importClienteToMotoboy(ids: string[], motoboyId?: string) {
    return apiFetch<{ importadas: Entrega[]; total: number }>(
      '/api/entregas/cliente/importar-motoboy',
      {
        method: 'POST',
        body: JSON.stringify({ ids, motoboyId }),
      },
    )
  },

  delete(id: string) {
    return apiFetch<void>(`/api/entregas/${id}`, { method: 'DELETE' })
  },
}
