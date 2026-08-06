import type { Entrega, Pendencia } from '@/shared/types/api.types'

export type PrestacaoMotoboyStatus = 'ENVIADA' | 'APROVADA' | 'REJEITADA'

export interface PrestacaoMotoboy {
  id: string
  motoboyId: string
  data: string
  totalEntregas: number
  valorTotal: string
  valorPendencias: string
  valorFinal: string
  observacoes: string | null
  status: PrestacaoMotoboyStatus
  motivoRejeicao: string | null
  aprovadaEm: string | null
  rejeitadaEm: string | null
  criadoEm: string
  motoboy?: { id: string; nome: string; email: string }
}

export interface PrestacaoMotoboyPreview {
  data: string
  totalEntregas: number
  valorTotal: number
  entregasPagasPeloCliente: number
  valorPagasPeloCliente: number
  valorPendencias: number
  valorFinal: number
  totalPendencias: number
  statusExistente: PrestacaoMotoboyStatus | null
  prestacaoId: string | null
}

export interface SubmitPrestacaoMotoboyResponse {
  prestacao: PrestacaoMotoboy
  entregas: Entrega[]
  pendencias: Pendencia[]
  whatsappText: string
}
