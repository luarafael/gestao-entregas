import { z } from 'zod'

export const createEntregaSchema = z.object({
  nomeCliente: z.string().trim().optional(),
  endereco: z.string().trim().min(1, 'Endereço é obrigatório'),
  bairro: z.string().trim().min(1, 'Bairro é obrigatório'),
  cidade: z.string().trim().optional(),
  valorEntrega: z.coerce.number().positive('Valor deve ser maior que zero'),
  observacao: z.string().trim().optional(),
})

export const updateEntregaSchema = createEntregaSchema.partial().extend({
  status: z.enum(['ENTREGUE', 'CANCELADA']).optional(),
})

export const listEntregasSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  filter: z.enum(['today', 'yesterday', 'week', 'month']).default('today'),
  sortBy: z
    .enum(['horario', 'nomeCliente', 'bairro', 'valorEntrega'])
    .default('horario'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type CreateEntregaInput = z.infer<typeof createEntregaSchema>
export type UpdateEntregaInput = z.infer<typeof updateEntregaSchema>
export type ListEntregasInput = z.infer<typeof listEntregasSchema>
