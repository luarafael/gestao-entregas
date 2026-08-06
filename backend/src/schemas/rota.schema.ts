import { z } from 'zod'
import { toUtcDateOnly } from '../utils/date.utils.js'

export const prioridadeParadaSchema = z.enum(['NORMAL', 'URGENTE'])

export const optimizeParadaSchema = z
  .object({
    tempId: z.string().min(1),
    entregaId: z.string().optional().nullable(),
    cliente: z.string().trim().optional().nullable(),
    endereco: z.string().trim().min(1, 'Endereço é obrigatório'),
    bairro: z.string().trim().optional().nullable(),
    observacao: z.string().trim().optional().nullable(),
    prioridade: prioridadeParadaSchema.default('NORMAL'),
    ordemUrgencia: z.coerce.number().int().positive().optional().nullable(),
    valorEntrega: z.coerce.number().nonnegative().optional().nullable(),
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

export const optimizeRotaSchema = z.object({
  enderecoInicial: z.string().trim().min(1, 'Endereço inicial é obrigatório'),
  paradas: z.array(optimizeParadaSchema).min(1, 'Informe ao menos uma entrega'),
})

export const saveRotaSchema = z.object({
  data: z
    .union([z.string(), z.coerce.date()])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined
      if (typeof value === 'string') return toUtcDateOnly(value)
      return toUtcDateOnly(value)
    })
    .pipe(z.date().optional()),
  enderecoInicial: z.string().trim().min(1),
  distanciaTotal: z.coerce.number().nonnegative(),
  tempoTotal: z.coerce.number().int().nonnegative(),
  aproximada: z.boolean().default(false),
  polyline: z.string().optional().nullable(),
  sugestoes: z.array(z.string()).optional(),
  paradas: z
    .array(
      optimizeParadaSchema.extend({
        ordem: z.coerce.number().int().positive(),
        distancia: z.coerce.number().nonnegative().optional().nullable(),
        tempo: z.coerce.number().int().nonnegative().optional().nullable(),
        latitude: z.coerce.number().optional().nullable(),
        longitude: z.coerce.number().optional().nullable(),
      }),
    )
    .min(1),
})

export const listRotasSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
})

export const syncParadaFromEntregaSchema = z.object({
  entregaId: z.string().min(1),
  cliente: z.string().trim().optional().nullable(),
  endereco: z.string().trim().min(1),
  bairro: z.string().trim().optional().nullable(),
  observacao: z.string().trim().optional().nullable(),
  valorEntrega: z.coerce.number().nonnegative().optional().nullable(),
})

export const updateEnderecoPartidaSchema = z.object({
  enderecoPartidaPadrao: z
    .string()
    .trim()
    .min(1, 'Endereço de partida é obrigatório'),
})

export const DEFAULT_ENDERECO_PARTIDA =
  'Leite Gondim, 895 - Antônio Bezerra - Fortaleza/CE'

export type OptimizeRotaInput = z.infer<typeof optimizeRotaSchema>
export type SaveRotaInput = z.infer<typeof saveRotaSchema>
export type ListRotasInput = z.infer<typeof listRotasSchema>
export type SyncParadaFromEntregaInput = z.infer<
  typeof syncParadaFromEntregaSchema
>
export type UpdateEnderecoPartidaInput = z.infer<
  typeof updateEnderecoPartidaSchema
>
