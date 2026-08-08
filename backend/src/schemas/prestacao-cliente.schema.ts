import { z } from 'zod'
import { toUtcDateOnly } from '../utils/date.utils.js'

export const submitPrestacaoClienteSchema = z.object({
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
  nomeCliente: z.string().trim().min(1, 'Selecione um cliente'),
  observacoes: z.string().trim().optional(),
})

export const previewPrestacaoClienteQuerySchema = z.object({
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .optional()
    .transform((value) => (value ? toUtcDateOnly(value) : undefined)),
  nomeCliente: z.string().trim().min(1, 'Selecione um cliente'),
})

export const listPrestacoesClienteSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  nomeCliente: z.string().trim().optional(),
})

export const listClientesByDateQuerySchema = z.object({
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .transform((value) => toUtcDateOnly(value)),
})

export const listHistoricoPrestacaoSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  tipo: z.enum(['all', 'empresa', 'motoboy', 'cliente']).default('all'),
  motoboyId: z.string().trim().optional(),
  nomeCliente: z.string().trim().optional(),
})

export const prestacaoWhatsAppQuerySchema = z.object({
  motoboyId: z.string().trim().optional(),
})

export type SubmitPrestacaoClienteInput = z.infer<typeof submitPrestacaoClienteSchema>
export type PreviewPrestacaoClienteQuery = z.infer<
  typeof previewPrestacaoClienteQuerySchema
>
export type ListPrestacoesClienteInput = z.infer<typeof listPrestacoesClienteSchema>
export type ListClientesByDateQuery = z.infer<typeof listClientesByDateQuerySchema>
export type ListHistoricoPrestacaoInput = z.infer<typeof listHistoricoPrestacaoSchema>
export type PrestacaoWhatsAppQuery = z.infer<typeof prestacaoWhatsAppQuerySchema>
