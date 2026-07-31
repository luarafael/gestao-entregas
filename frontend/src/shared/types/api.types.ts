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
