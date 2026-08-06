import { z } from 'zod'
import { toUtcDateOnly } from '../utils/date.utils.js'

export const dashboardStatsQuerySchema = z.object({
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .optional()
    .transform((value) => (value ? toUtcDateOnly(value) : undefined)),
  motoboyId: z.string().trim().min(1).optional(),
})

export type DashboardStatsQuery = z.infer<typeof dashboardStatsQuerySchema>

export const monitoramentoQuerySchema = z.object({
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .optional()
    .transform((value) => (value ? toUtcDateOnly(value) : undefined)),
  motoboyId: z.string().trim().min(1, 'Selecione um motoboy'),
})

export type MonitoramentoQuery = z.infer<typeof monitoramentoQuerySchema>

const entregaBaseSchema = z.object({
  nomeCliente: z.string().trim().optional(),
  endereco: z.string().trim().min(1, 'Endereço é obrigatório'),
  bairro: z.string().trim().min(1, 'Bairro é obrigatório'),
  cidade: z.string().trim().optional(),
  valorEntrega: z.coerce.number().positive('Valor deve ser maior que zero'),
  observacao: z.string().trim().optional(),
  pagoPeloCliente: z.boolean().optional().default(false),
  motoboyId: z.string().trim().min(1).optional(),
})

export const createEntregaSchema = entregaBaseSchema.superRefine((data, ctx) => {
  if (data.pagoPeloCliente && !data.nomeCliente?.trim()) {
    ctx.addIssue({
      code: 'custom',
      message: 'Informe o nome do cliente quando a corrida foi paga por ele',
      path: ['nomeCliente'],
    })
  }
})

export const updateEntregaSchema = entregaBaseSchema.partial().extend({
  status: z.enum(['ENTREGUE', 'CANCELADA']).optional(),
}).superRefine((data, ctx) => {
  if (data.pagoPeloCliente && !data.nomeCliente?.trim()) {
    ctx.addIssue({
      code: 'custom',
      message: 'Informe o nome do cliente quando a corrida foi paga por ele',
      path: ['nomeCliente'],
    })
  }
})

export const listEntregasSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  filter: z.enum(['today', 'yesterday', 'week', 'month']).default('today'),
  referenceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .optional(),
  sortBy: z
    .enum(['horario', 'nomeCliente', 'bairro', 'valorEntrega'])
    .default('horario'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  motoboyId: z.string().trim().min(1).optional(),
})

export type CreateEntregaInput = z.infer<typeof createEntregaSchema>
export type UpdateEntregaInput = z.infer<typeof updateEntregaSchema>
export type ListEntregasInput = z.infer<typeof listEntregasSchema>
