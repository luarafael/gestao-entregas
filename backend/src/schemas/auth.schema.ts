import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const updatePixSchema = z.object({
  pix: z
    .string()
    .trim()
    .max(140, 'PIX deve ter no máximo 140 caracteres')
    .transform((value) => value || null),
})

export type UpdatePixInput = z.infer<typeof updatePixSchema>

export const usuarioPublicSchema = z.object({
  id: z.string(),
  nome: z.string(),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MOTOBOY']),
  pix: z.string().nullable().optional(),
})

export type UsuarioPublic = z.infer<typeof usuarioPublicSchema>
