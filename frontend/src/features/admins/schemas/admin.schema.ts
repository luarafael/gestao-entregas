import { z } from 'zod'

export const adminFormSchema = z
  .object({
    nome: z.string().trim().min(1, 'Nome é obrigatório'),
    email: z.string().trim().email('E-mail inválido'),
    senha: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const senha = data.senha?.trim() ?? ''
    if (senha.length > 0 && senha.length < 6) {
      ctx.addIssue({
        code: 'custom',
        path: ['senha'],
        message: 'Senha deve ter no mínimo 6 caracteres',
      })
    }
  })

export type AdminFormData = z.infer<typeof adminFormSchema>

export type AdminAtivoFilter = 'all' | 'true' | 'false'

export interface AdminFilters {
  page: number
  limit: number
  search: string
  ativo?: AdminAtivoFilter
}

export const ATIVO_OPTIONS: Array<{ value: AdminAtivoFilter; label: string }> =
  [
    { value: 'all', label: 'Todos' },
    { value: 'true', label: 'Ativos' },
    { value: 'false', label: 'Inativos' },
  ]

export function toCreatePayload(data: AdminFormData) {
  return {
    nome: data.nome.trim(),
    email: data.email.trim().toLowerCase(),
    senha: data.senha!.trim(),
  }
}

export function toUpdatePayload(data: AdminFormData) {
  const payload: {
    nome: string
    email: string
    senha?: string
  } = {
    nome: data.nome.trim(),
    email: data.email.trim().toLowerCase(),
  }

  const senha = data.senha?.trim()
  if (senha) {
    payload.senha = senha
  }

  return payload
}
