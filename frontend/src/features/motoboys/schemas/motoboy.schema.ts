import { z } from 'zod'

export const motoboyFormSchema = z
  .object({
    nome: z.string().trim().min(1, 'Nome é obrigatório'),
    email: z.string().trim().email('E-mail inválido'),
    senha: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const senha = data.senha?.trim() ?? ''
    // Senha obrigatória só na criação — validamos no formulário com flag
    if (senha.length > 0 && senha.length < 6) {
      ctx.addIssue({
        code: 'custom',
        path: ['senha'],
        message: 'Senha deve ter no mínimo 6 caracteres',
      })
    }
  })

export type MotoboyFormData = z.infer<typeof motoboyFormSchema>

export type MotoboyAtivoFilter = 'all' | 'true' | 'false'

export interface MotoboyFilters {
  page: number
  limit: number
  search: string
  ativo?: MotoboyAtivoFilter
}

export const ATIVO_OPTIONS: Array<{ value: MotoboyAtivoFilter; label: string }> =
  [
    { value: 'all', label: 'Todos' },
    { value: 'true', label: 'Ativos' },
    { value: 'false', label: 'Inativos' },
  ]

export function toCreatePayload(data: MotoboyFormData) {
  return {
    nome: data.nome.trim(),
    email: data.email.trim().toLowerCase(),
    senha: data.senha!.trim(),
  }
}

export function toUpdatePayload(data: MotoboyFormData) {
  const payload: { nome: string; email: string; senha?: string } = {
    nome: data.nome.trim(),
    email: data.email.trim().toLowerCase(),
  }

  const senha = data.senha?.trim()
  if (senha) {
    payload.senha = senha
  }

  return payload
}
