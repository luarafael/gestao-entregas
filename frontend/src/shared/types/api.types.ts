export interface DashboardStats {
  entregasHoje: number
  valorRecebidoHoje: number
  totalPendencias: number
  valorTotalDia: number
  valorProdutoHoje?: number
  valorEntregaMotoboyHoje?: number
  pedidosPagosHoje?: number
  pedidosNaoPagosHoje?: number
  pedidosClientesHoje?: number
}

export interface Entrega {
  id: string
  data: string
  horario: string
  nomeCliente: string | null
  telefoneCliente?: string | null
  endereco: string
  bairro: string
  cidade: string | null
  observacao: string | null
  valorProduto: string | null
  formaPagamento: 'DINHEIRO' | 'PIX' | 'CARTAO' | null
  valorEntrega: string
  valorEntregaMotoboy?: string | null
  statusPagamentoCliente?: 'PAGO' | 'NAO_PAGO' | null
  pagoPeloCliente: boolean
  origemCadastro?: 'MOTOBOY' | 'CLIENTE'
  entregaMotoboyId?: string | null
  status: 'ENTREGUE' | 'CANCELADA'
  motoboyId?: string | null
  motoboy?: { id: string; nome: string } | null
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
  tipo: 'CLIENTE' | 'REPASSE_MOTOBOY'
  motoboyId?: string | null
  motoboy?: { id: string; nome: string } | null
  criadoEm: string
}

export interface MotoboyResumo {
  data: string
  entregasHoje: number
  valorRecebidoHoje: number
  entregasPagasPeloCliente: number
  valorPagasPeloCliente: number
  pendenciasAbertas: number
  valorPendenciasAbertas: number
  entregas: Entrega[]
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
