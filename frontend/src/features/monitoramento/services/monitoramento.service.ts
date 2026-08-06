import { apiFetch } from '@/shared/services/api'
import type { MonitoramentoResponse } from '../types'

export const monitoramentoService = {
  get(data?: string) {
    const query = data ? `?data=${encodeURIComponent(data)}` : ''
    return apiFetch<MonitoramentoResponse>(`/api/entregas/monitoramento${query}`)
  },
}
