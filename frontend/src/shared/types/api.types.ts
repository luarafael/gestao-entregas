export interface DashboardStats {
  entregasHoje: number
  valorRecebidoHoje: number
  totalPendencias: number
  valorTotalDia: number
}

export interface Entrega {
  id: string
  data: string
  horario: string
  nomeCliente: string | null
  endereco: string
  bairro: string
  cidade: string | null
  observacao: string | null
  valorEntrega: string
  pagoPeloCliente: boolean
  status: 'ENTREGUE' | 'CANCELADA'
  criadoEm: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface Pendencia {
  id: string
  descricao: string
  valor: string
  referenteAoDia: string
  status: 'PENDENTE' | 'RECEBIDO'
  criadoEm: string
}

export type ReportPeriod = 'week' | 'month'

export interface ReportSummary {
  period: ReportPeriod
  totalEntregas: number
  valorEntregas: number
  mediaEntregasPorDia: number
  mediaValorPorDia: number
  totalPrestacoes: number
  valorFinalPrestacoes: number
  pendenciasAbertas: number
  valorPendenciasAbertas: number
}

export interface DailyTrendPoint {
  date: string
  entregas: number
  valor: number
  valorEntregas?: number
  valorPendencias?: number
  temPrestacao?: boolean
}

export interface NeighborhoodReportPoint {
  bairro: string
  entregas: number
  valor: number
}

export interface PrestacaoTrendPoint {
  date: string
  valorFinal: number
  totalEntregas: number
}
