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

  async upsertMotoboy(input: CreateUsuarioInput) {
    const email = input.email.toLowerCase().trim()
    const existing = await prisma.usuario.findUnique({ where: { email } })

    if (existing?.role === 'ADMIN') {
      throw new Error(
        `Não foi possível criar motoboy: o e-mail ${email} já pertence a um administrador`,
      )
    }

    return prisma.usuario.upsert({
      where: { email },
      update: {
        nome: input.nome.trim(),
        senhaHash: input.senhaHash,
        role: 'MOTOBOY',
        ativo: true,
      },
      create: {
        nome: input.nome.trim(),
        email,
        senhaHash: input.senhaHash,
        role: 'MOTOBOY',
      },
    })
  },
}
