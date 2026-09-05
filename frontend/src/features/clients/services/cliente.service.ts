import { apiFetch } from '@/shared/services/api'
import type { ClienteInput } from '../schemas/cliente.schema'

export interface Cliente extends ClienteInput {
  id: string
  criadoEm: string
  atualizadoEm: string
}
export interface ClientesResult {
  data: Cliente[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}
export const clienteService = {
  delete(id: string) {
    return apiFetch<void>(`/api/clientes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },
  list(search: string, page: number) {
    const params = new URLSearchParams({
      search,
      page: String(page),
      limit: '20',
    })
    return apiFetch<ClientesResult>(`/api/clientes?${params}`)
  },
  save(data: ClienteInput, id?: string) {
    return apiFetch<Cliente>(
      id ? `/api/clientes/${encodeURIComponent(id)}` : '/api/clientes',
      {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(data),
      },
    )
  },
}
