import type { Entrega, Pendencia } from '@/shared/types/api.types'

export interface PrestacaoContas {
  id: string
  data: string
  totalEntregas: number
  valorTotal: string
  valorPendencias: string
  valorFinal: string
  observacoes: string | null
  criadoEm: string
}

export interface GeneratePrestacaoResponse {
  prestacao: PrestacaoContas
  entregas: Entrega[]
  pendencias: Pendencia[]
  whatsappText: string
}

export interface PrestacaoPreview {
  data: string
  totalEntregas: number
  valorTotal: number
  entregasPagasPeloCliente: number
  valorPagasPeloCliente: number
  valorPendencias: number
  valorFinal: number
  totalPendencias: number
}

export type { GeneratePrestacaoFormData, PrestacaoFilters } from '../schemas/prestacao.schema'
export {
  generatePrestacaoFormSchema,
  defaultGenerateFormValues,
  toGeneratePayload,
  formatPrestacaoDate,
} from '../schemas/prestacao.schema'
