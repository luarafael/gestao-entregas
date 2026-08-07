import { apiFetch } from '@/shared/services/api'
import type { MonitoramentoResponse } from '../types'

export const monitoramentoService = {
  get(data: string | undefined, motoboyId: string) {
    const params = new URLSearchParams()
    if (data) {
      params.set('data', data)
    }
    params.set('motoboyId', motoboyId)
    return apiFetch<MonitoramentoResponse>(
      `/api/entregas/monitoramento?${params.toString()}`,
    )
  },

  getEventos(since: string, motoboyId?: string) {
    const params = new URLSearchParams({ since })
    if (motoboyId) {
      params.set('motoboyId', motoboyId)
    }
    return apiFetch<{
      eventos: Array<{
        id: string
        motoboyId: string | null
        motoboyNome: string
        cliente: string | null
        endereco: string
        ordem: number | null
        dataHoraStatus: string
      }>
    }>(`/api/entregas/monitoramento/eventos?${params.toString()}`)
  },
}
