import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const usuarioPublicSchema = z.object({
  id: z.string(),
  nome: z.string(),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MOTOBOY']),
})

export type UsuarioPublic = z.infer<typeof usuarioPublicSchema>
