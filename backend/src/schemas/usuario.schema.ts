import { z } from 'zod'

export const createMotoboySchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório'),
  email: z.string().trim().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export const updateMotoboySchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').optional(),
  email: z.string().trim().email('E-mail inválido').optional(),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
})

export const listMotoboysSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  ativo: z
    .enum(['true', 'false', 'all'])
    .optional()
    .default('all')
    .transform((value) => {
      if (value === 'true') return true
      if (value === 'false') return false
      return undefined
    }),
})

export const setMotoboyAtivoSchema = z.object({
  ativo: z.boolean(),
})

export type CreateMotoboyInput = z.infer<typeof createMotoboySchema>
export type UpdateMotoboyInput = z.infer<typeof updateMotoboySchema>
export type ListMotoboysInput = z.infer<typeof listMotoboysSchema>
export type SetMotoboyAtivoInput = z.infer<typeof setMotoboyAtivoSchema>
