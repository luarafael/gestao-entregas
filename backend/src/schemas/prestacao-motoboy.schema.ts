import { z } from 'zod'
import { toUtcDateOnly } from '../utils/date.utils.js'

export const submitPrestacaoMotoboySchema = z.object({
  data: z
    .union([z.string(), z.coerce.date()])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined
      if (typeof value === 'string') {
        return toUtcDateOnly(value)
      }
      return toUtcDateOnly(value)
    }),
  observacoes: z.string().trim().optional(),
  /** Admin gera/envia prestação em nome do motoboy selecionado */
  motoboyId: z.string().trim().min(1).optional(),
})

export const listPrestacoesMotoboySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(['ENVIADA', 'APROVADA', 'REJEITADA']).optional(),
  motoboyId: z.string().trim().min(1).optional(),
  historico: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
})

export const previewPrestacaoMotoboyQuerySchema = z.object({
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .optional()
    .transform((value) => (value ? toUtcDateOnly(value) : undefined)),
  motoboyId: z.string().trim().min(1).optional(),
})

export const rejectPrestacaoMotoboySchema = z.object({
  motivoRejeicao: z.string().trim().min(1, 'Informe o motivo da rejeição'),
})

export const updatePrestacaoMotoboySchema = z.object({
  observacoes: z.string().trim().nullable().optional(),
  recalcular: z.boolean().optional(),
})

export const listPendentesQuerySchema = z.object({
  motoboyId: z.string().trim().min(1).optional(),
})

export const prestacaoMotoboyEventosQuerySchema = z.object({
  since: z.string().datetime({ message: 'Data/hora inválida' }),
})

export type SubmitPrestacaoMotoboyInput = z.infer<typeof submitPrestacaoMotoboySchema>
export type ListPrestacoesMotoboyInput = z.infer<typeof listPrestacoesMotoboySchema>
export type ListPendentesQuery = z.infer<typeof listPendentesQuerySchema>
export type PreviewPrestacaoMotoboyQuery = z.infer<
  typeof previewPrestacaoMotoboyQuerySchema
>
export type RejectPrestacaoMotoboyInput = z.infer<typeof rejectPrestacaoMotoboySchema>
export type UpdatePrestacaoMotoboyInput = z.infer<typeof updatePrestacaoMotoboySchema>
export type PrestacaoMotoboyEventosQuery = z.infer<
  typeof prestacaoMotoboyEventosQuerySchema
>
