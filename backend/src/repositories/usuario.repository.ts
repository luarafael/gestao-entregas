import { prisma } from '../lib/prisma.js'
import type { UsuarioRole } from '../../generated/prisma/client.js'
import type { Prisma } from '../../generated/prisma/client.js'

export interface CreateUsuarioInput {
  nome: string
  email: string
  senhaHash: string
  role?: UsuarioRole
  pix?: string | null
}

export interface ListMotoboysFilters {
  page: number
  limit: number
  search?: string
  ativo?: boolean
}

const motoboyPublicSelect = {
  id: true,
  nome: true,
  email: true,
  pix: true,
  role: true,
  ativo: true,
  criadoEm: true,
  atualizadoEm: true,
} as const

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

  findMotoboyById(id: string) {
    return prisma.usuario.findFirst({
      where: { id, role: 'MOTOBOY' },
      select: motoboyPublicSelect,
    })
  },

  async findMotoboys(filters: ListMotoboysFilters) {
    const skip = (filters.page - 1) * filters.limit
    const search = filters.search?.trim()

    const where: Prisma.UsuarioWhereInput = {
      role: 'MOTOBOY',
      ...(filters.ativo !== undefined ? { ativo: filters.ativo } : {}),
      ...(search
        ? {
            OR: [
              { nome: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    }

    const [data, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
        select: motoboyPublicSelect,
      }),
      prisma.usuario.count({ where }),
    ])

    return { data, total }
  },

  create(input: CreateUsuarioInput) {
    return prisma.usuario.create({
      data: {
        nome: input.nome.trim(),
        email: input.email.toLowerCase().trim(),
        senhaHash: input.senhaHash,
        role: input.role ?? 'MOTOBOY',
        ...(input.pix !== undefined ? { pix: input.pix } : {}),
      },
      select: motoboyPublicSelect,
    })
  },

  updateMotoboy(
    id: string,
    data: {
      nome?: string
      email?: string
      senhaHash?: string
      pix?: string | null
    },
  ) {
    return prisma.usuario.update({
      where: { id },
      data: {
        ...(data.nome !== undefined ? { nome: data.nome.trim() } : {}),
        ...(data.email !== undefined
          ? { email: data.email.toLowerCase().trim() }
          : {}),
        ...(data.senhaHash !== undefined ? { senhaHash: data.senhaHash } : {}),
        ...(data.pix !== undefined ? { pix: data.pix } : {}),
      },
      select: motoboyPublicSelect,
    })
  },

  updatePix(id: string, pix: string | null) {
    return prisma.usuario.update({
      where: { id },
      data: { pix },
      select: motoboyPublicSelect,
    })
  },

  setAtivo(id: string, ativo: boolean) {
    return prisma.usuario.update({
      where: { id },
      data: { ativo },
      select: motoboyPublicSelect,
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
