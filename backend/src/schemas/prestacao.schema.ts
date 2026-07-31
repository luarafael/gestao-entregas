import { z } from 'zod'

export const generatePrestacaoSchema = z.object({
  data: z.coerce.date().optional(),
  observacoes: z.string().trim().optional(),
})

export const listPrestacoesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
})

export type GeneratePrestacaoInput = z.infer<typeof generatePrestacaoSchema>
export type ListPrestacoesInput = z.infer<typeof listPrestacoesSchema>
