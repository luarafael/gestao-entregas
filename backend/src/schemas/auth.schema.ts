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

const MAX_FOTO_PERFIL_LENGTH = 3_000_000

export const updateFotoPerfilSchema = z.object({
  fotoPerfil: z
    .string()
    .max(
      MAX_FOTO_PERFIL_LENGTH,
      'A imagem é grande demais. Use uma foto de até 2 MB.',
    )
    .regex(/^data:image\/[a-zA-Z+.-]+;base64,/, 'Formato de imagem inválido')
    .nullable(),
})

export type UpdateFotoPerfilInput = z.infer<typeof updateFotoPerfilSchema>

export const usuarioPublicSchema = z.object({
  id: z.string(),
  nome: z.string(),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MOTOBOY']),
  pix: z.string().nullable().optional(),
  fotoPerfil: z.string().nullable().optional(),
})

export type UsuarioPublic = z.infer<typeof usuarioPublicSchema>
