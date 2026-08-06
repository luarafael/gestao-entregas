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
})

export const listPrestacoesMotoboySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(['ENVIADA', 'APROVADA', 'REJEITADA']).optional(),
  motoboyId: z.string().trim().min(1).optional(),
})

export const previewPrestacaoMotoboyQuerySchema = z.object({
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .optional()
    .transform((value) => (value ? toUtcDateOnly(value) : undefined)),
})

export const rejectPrestacaoMotoboySchema = z.object({
  motivoRejeicao: z.string().trim().min(1, 'Informe o motivo da rejeição'),
})

export type SubmitPrestacaoMotoboyInput = z.infer<typeof submitPrestacaoMotoboySchema>
export type ListPrestacoesMotoboyInput = z.infer<typeof listPrestacoesMotoboySchema>
export type PreviewPrestacaoMotoboyQuery = z.infer<
  typeof previewPrestacaoMotoboyQuerySchema
>
export type RejectPrestacaoMotoboyInput = z.infer<typeof rejectPrestacaoMotoboySchema>
