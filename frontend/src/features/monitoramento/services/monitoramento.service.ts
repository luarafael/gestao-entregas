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
}
