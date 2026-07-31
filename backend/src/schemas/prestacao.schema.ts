import { z } from 'zod'
import { toUtcDateOnly } from '../utils/date.utils.js'

export const generatePrestacaoSchema = z.object({
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

export const updatePrestacaoSchema = z.object({
  observacoes: z.string().trim().optional().nullable(),
  recalcular: z.boolean().optional(),
})

export const listPrestacoesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
})

export type GeneratePrestacaoInput = z.infer<typeof generatePrestacaoSchema>
export type UpdatePrestacaoInput = z.infer<typeof updatePrestacaoSchema>
export type ListPrestacoesInput = z.infer<typeof listPrestacoesSchema>
