import { z } from 'zod'

export const prioridadeParadaSchema = z.enum(['NORMAL', 'URGENTE'])

export const plannerStopSchema = z.object({
  cliente: z.string().trim().optional(),
  endereco: z.string().trim().min(1, 'Endereço é obrigatório'),
  observacao: z.string().trim().optional(),
  prioridade: prioridadeParadaSchema,
})

export type PrioridadeParada = z.infer<typeof prioridadeParadaSchema>
export type PlannerStopFormData = z.infer<typeof plannerStopSchema>

export const DEFAULT_START_ADDRESS =
  'Leite Gondim, 895 - Antônio Bezerra - Fortaleza/CE'

export interface PlannerStop {
  tempId: string
  entregaId?: string | null
  cliente?: string | null
  endereco: string
  bairro?: string | null
  observacao?: string | null
  prioridade: PrioridadeParada
  valorEntrega?: number | null
  ordem?: number
  distancia?: number | null
  tempo?: number | null
  latitude?: number | null
  longitude?: number | null
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
}

export interface RotaPlanejada {
  id: string
  data: string
  enderecoInicial: string
  distanciaTotal: string
  tempoTotal: number
  aproximada: boolean
  criadoEm: string
  paradas: Array<{
    id: string
    entregaId?: string | null
    cliente?: string | null
    endereco: string
    bairro?: string | null
    observacao?: string | null
    ordem: number
    distancia?: string | null
    tempo?: number | null
    prioridade: PrioridadeParada
    valorEntrega?: string | null
    latitude?: number | null
    longitude?: number | null
  }>
}
