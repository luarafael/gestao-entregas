import { apiFetch } from '@/shared/services/api'
import type { PaginatedResponse } from '@/shared/types/api.types'
import type {
  PrestacaoClientePreview,
  PrestacaoHistoricoFilters,
  PrestacaoHistoricoItem,
  SubmitPrestacaoClienteResponse,
} from '../types/prestacaoCliente.types'
import type { SubmitPrestacaoClienteFormData } from '../schemas/prestacaoCliente.schema'
import type { PrestacaoCliente } from '../types/prestacaoCliente.types'

export const prestacaoClienteService = {
  listClientesByDate(data: string) {
    const params = new URLSearchParams({ data })
    return apiFetch<{ clientes: string[] }>(
      `/api/prestacoes-cliente/clientes?${params.toString()}`,
    )
  },

  preview(data: string, nomeCliente: string) {
    const params = new URLSearchParams({ data, nomeCliente })
    return apiFetch<PrestacaoClientePreview>(
      `/api/prestacoes-cliente/preview?${params.toString()}`,
    )
  },

  submit(data: SubmitPrestacaoClienteFormData) {
    return apiFetch<SubmitPrestacaoClienteResponse>('/api/prestacoes-cliente', {
      method: 'POST',
      body: JSON.stringify({
        data: data.data,
        nomeCliente: data.nomeCliente,
        observacoes: data.observacoes?.trim() || undefined,
      }),
    })
  },

  getWhatsAppText(id: string) {
    return apiFetch<{ text: string }>(`/api/prestacoes-cliente/${id}/whatsapp`)
  },

  getEventos(since: string) {
    const params = new URLSearchParams({ since })
    return apiFetch<{
      eventos: Array<{
        id: string
        tipo: 'cliente'
        nomeCliente: string
        data: string
        criadoEm: string
      }>
    }>(`/api/prestacoes-cliente/eventos?${params.toString()}`)
  },

  getById(id: string) {
    return apiFetch<PrestacaoCliente>(`/api/prestacoes-cliente/${id}`)
  },

  update(id: string, data: { observacoes?: string | null; recalcular?: boolean }) {
    return apiFetch<PrestacaoCliente>(`/api/prestacoes-cliente/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete(id: string) {
    return apiFetch<void>(`/api/prestacoes-cliente/${id}`, { method: 'DELETE' })
  },

  listHistorico(filters: PrestacaoHistoricoFilters) {
    const params = new URLSearchParams({
      page: String(filters.page),
      limit: String(filters.limit),
      tipo: filters.tipo,
    })

    if (filters.motoboyId) {
      params.set('motoboyId', filters.motoboyId)
    }

    if (filters.nomeCliente) {
      params.set('nomeCliente', filters.nomeCliente)
    }

    return apiFetch<PaginatedResponse<PrestacaoHistoricoItem>>(
      `/api/prestacoes/historico?${params.toString()}`,
    )
  },
}
