import type { Entrega, Pendencia } from '@/shared/types/api.types'

export interface PrestacaoContas {
  id: string
  data: string
  totalEntregas: number
  valorTotal: string
  valorPendencias: string
  valorFinal: string
  valorRepasseMotoboys: string
  valorLiquido: string
  observacoes: string | null
  criadoEm: string
}

export interface PrestacaoMotoboyResumo {
  id: string
  motoboyId: string
  motoboyNome: string
  totalEntregas: number
  valorFinal: number
  status: 'ENVIADA' | 'APROVADA' | 'REJEITADA'
}

export interface GeneratePrestacaoResponse {
  prestacao: PrestacaoContas
  entregas: Entrega[]
  pendencias: Pendencia[]
  prestacoesMotoboy?: PrestacaoMotoboyResumo[]
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
  valorRepasseMotoboys: number
  valorLiquido: number
  totalPendencias: number
  pendentesAprovacaoMotoboy: number
  prestacoesMotoboy: PrestacaoMotoboyResumo[]
}

export type { GeneratePrestacaoFormData, PrestacaoFilters } from '../schemas/prestacao.schema'
export {
  generatePrestacaoFormSchema,
  defaultGenerateFormValues,
  toGeneratePayload,
  formatPrestacaoDate,
} from '../schemas/prestacao.schema'
