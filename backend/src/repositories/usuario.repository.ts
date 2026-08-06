import { prisma } from '../lib/prisma.js'
import type { UsuarioRole } from '../../generated/prisma/client.js'

export interface CreateUsuarioInput {
  nome: string
  email: string
  senhaHash: string
  role?: UsuarioRole
}

export const usuarioRepository = {
  findByEmail(email: string) {
    return prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    })
  },

  findById(id: string) {
    return prisma.usuario.findUnique({
      where: { id },
    })
  },

  create(input: CreateUsuarioInput) {
    return prisma.usuario.create({
      data: {
        nome: input.nome.trim(),
        email: input.email.toLowerCase().trim(),
        senhaHash: input.senhaHash,
        role: input.role ?? 'MOTOBOY',
      },
    })
  },

  upsertAdmin(input: CreateUsuarioInput) {
    return prisma.usuario.upsert({
      where: { email: input.email.toLowerCase().trim() },
      update: {
        nome: input.nome.trim(),
        senhaHash: input.senhaHash,
        role: 'ADMIN',
        ativo: true,
      },
      create: {
        nome: input.nome.trim(),
        email: input.email.toLowerCase().trim(),
        senhaHash: input.senhaHash,
        role: 'ADMIN',
      },
    })
  },
}
