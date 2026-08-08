import { z } from 'zod'

export const prioridadeParadaSchema = z.enum(['NORMAL', 'URGENTE'])

export const plannerStopSchema = z
  .object({
    cliente: z.string().trim().optional(),
    endereco: z.string().trim().min(1, 'Endereço é obrigatório'),
    bairro: z.string().trim().optional(),
    telefone: z.string().trim().optional(),
    observacao: z.string().trim().optional(),
    prioridade: prioridadeParadaSchema,
    ordemUrgencia: z.number().int().positive().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.prioridade === 'NORMAL' && data.ordemUrgencia != null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Ordem de urgência só se aplica a entregas urgentes',
        path: ['ordemUrgencia'],
      })
    }
  })

export type PrioridadeParada = z.infer<typeof prioridadeParadaSchema>
export type PlannerStopFormData = z.infer<typeof plannerStopSchema>

export type StatusExecucao =
  | 'PENDENTE'
  | 'EM_ROTA'
  | 'ENTREGUE'
  | 'CLIENTE_AUSENTE'
  | 'NAO_LOCALIZADO'
  | 'CANCELADA'
  | 'FALHA_ENTREGA'

export const DEFAULT_START_ADDRESS =
  'Leite Gondim, 895 - Antônio Bezerra - Fortaleza/CE'

export interface PlannerStop {
  tempId: string
  entregaId?: string | null
  cliente?: string | null
  endereco: string
  bairro?: string | null
  telefone?: string | null
  observacao?: string | null
  prioridade: PrioridadeParada
  ordemUrgencia?: number | null
  valorEntrega?: number | null
  valorProduto?: number | null
  formaPagamento?: 'DINHEIRO' | 'PIX' | 'CARTAO' | null
  statusPagamentoCliente?: 'PAGO' | 'NAO_PAGO' | null
  ordem?: number
  distancia?: number | null
  tempo?: number | null
  /** Congelado ao marcar ENTREGUE para não perder no recálculo */
  distanciaEntrega?: number | null
  tempoEntrega?: number | null
  latitude?: number | null
  longitude?: number | null
  paradaId?: string | null
  statusExecucao?: StatusExecucao
  statusObservacao?: string | null
  statusAtualizadoEm?: string | null
}

export interface OptimizedRouteResult {
  enderecoInicial: string
  origem: { lat: number; lng: number } | null
  distanciaTotal: number
  tempoTotal: number
  totalEntregas: number
  aproximada: boolean
  polyline: string | null
  sugestoes: string[]
  paradas: PlannerStop[]
  rotaId?: string
}

export interface RotaPlanejada {
  id: string
  data: string
  enderecoInicial: string
  distanciaTotal: string
  tempoTotal: number
  aproximada: boolean
  concluidaEm?: string | null
  criadoEm: string
  paradas: Array<{
    id: string
    entregaId?: string | null
    cliente?: string | null
    endereco: string
    bairro?: string | null
    telefone?: string | null
    observacao?: string | null
    ordem: number
    distancia?: string | null
    tempo?: number | null
    prioridade: PrioridadeParada
    ordemUrgencia?: number | null
    valorEntrega?: string | null
    latitude?: number | null
    longitude?: number | null
  }>
}
