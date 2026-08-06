import type { StatusExecucao } from '@/features/routing/utils/executionStatus'

export interface MonitoramentoParada {
  paradaId: string
  ordem: number
  entregaId: string | null
  cliente: string | null
  endereco: string
  bairro: string | null
  telefone: string | null
  observacao: string | null
  status: StatusExecucao
  dataHoraStatus: string | null
  statusObservacao: string | null
  distancia: number | null
  tempo: number | null
}

export interface MonitoramentoRota {
  rotaId: string
  enderecoInicial: string
  distanciaTotal: number
  tempoTotal: number
  distanciaRestante: number
  tempoRestante: number
  motoboyId: string | null
  motoboyNome: string
  totalParadas: number
  stats: {
    pendentes: number
    emRota: number
    entregues: number
    problemas: number
    percentual: number
  }
  proximaParada: {
    paradaId: string
    ordem: number
    cliente: string | null
    endereco: string
    bairro: string | null
    status: StatusExecucao
    distancia: number | null
    tempo: number | null
  } | null
  paradas: MonitoramentoParada[]
}

export interface MonitoramentoEntregaAvulsa {
  id: string
  nomeCliente: string | null
  endereco: string
  bairro: string
  horario: string
  valorEntrega: number
  pagoPeloCliente: boolean
  motoboyId: string | null
  motoboyNome: string
}

export interface MonitoramentoGrupoAvulso {
  motoboyId: string | null
  motoboyNome: string
  entregas: MonitoramentoEntregaAvulsa[]
  totalEntregas: number
  valorTotal: number
}

export interface MonitoramentoResponse {
  data: string
  atualizadoEm: string
  resumo: {
    totalRotas: number
    totalParadas: number
    entregues: number
    emRota: number
    pendentes: number
    problemas: number
    entregasAvulsas: number
  }
  rotas: MonitoramentoRota[]
  entregasAvulsas: MonitoramentoGrupoAvulso[]
}
