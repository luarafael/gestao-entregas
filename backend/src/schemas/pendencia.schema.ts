import { z } from 'zod'

export const createPendenciaSchema = z.object({
  descricao: z.string().trim().min(1, 'Descrição é obrigatória'),
  valor: z.coerce.number().positive('Valor deve ser maior que zero'),
  referenteAoDia: z.coerce.date(),
  status: z.enum(['PENDENTE', 'RECEBIDO']).default('PENDENTE'),
})

export const updatePendenciaSchema = createPendenciaSchema.partial()

export const listPendenciasSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['PENDENTE', 'RECEBIDO']).optional(),
  tipo: z.enum(['CLIENTE', 'REPASSE_MOTOBOY']).optional(),
})

export type CreatePendenciaInput = z.infer<typeof createPendenciaSchema>
export type UpdatePendenciaInput = z.infer<typeof updatePendenciaSchema>
export type ListPendenciasInput = z.infer<typeof listPendenciasSchema>
