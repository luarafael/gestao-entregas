import type { Entrega } from '@/shared/types/api.types'

export interface MonitoramentoGrupo {
  motoboyId: string | null
  motoboyNome: string
  entregas: Entrega[]
  totalEntregas: number
  valorTotal: number
}

export interface MonitoramentoResponse {
  data: string
  atualizadoEm: string
  totalEntregas: number
  grupos: MonitoramentoGrupo[]
}
