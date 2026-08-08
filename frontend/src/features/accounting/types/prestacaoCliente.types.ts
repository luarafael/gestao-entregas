export type PrestacaoScope = 'empresa' | 'motoboy' | 'cliente'

export type PrestacaoHistoricoFilter = 'all' | PrestacaoScope

export type PrestacaoHistoricoTipo = PrestacaoScope

export interface PrestacaoHistoricoItem {
  id: string
  tipo: PrestacaoHistoricoTipo
  data: string
  titulo: string
  subtitulo: string | null
  totalEntregas: number
  valorFinal: number
  status: 'ENVIADA' | 'APROVADA' | 'REJEITADA' | null
  motivoRejeicao: string | null
}

export interface PrestacaoCliente {
  id: string
  nomeCliente: string
  data: string
  totalEntregas: number
  valorTotal: string
  valorFinal: string
  observacoes: string | null
  criadoEm: string
}

export interface PrestacaoClientePreview {
  data: string
  nomeCliente: string
  totalEntregas: number
  valorTotal: number
  entregasPagasPeloCliente: number
  valorPagasPeloCliente: number
  valorFinal: number
  prestacaoId: string | null
}

export interface SubmitPrestacaoClienteResponse {
  prestacao: PrestacaoCliente
  entregas: unknown[]
  whatsappText: string
}

export interface PrestacaoHistoricoFilters {
  page: number
  limit: number
  tipo: PrestacaoHistoricoFilter
  motoboyId?: string
  nomeCliente?: string
}
