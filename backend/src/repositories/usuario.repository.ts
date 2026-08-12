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
  excludeEmail?: string
  excludeUserId?: string
}

const motoboyPublicSelect = {
  id: true,
  nome: true,
  email: true,
  pix: true,
  fotoPerfil: true,
  role: true,
  ativo: true,
  criadoEm: true,
  atualizadoEm: true,
} as const

const adminPublicSelect = {
  id: true,
  nome: true,
  email: true,
  fotoPerfil: true,
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

  async findAdmins(filters: ListMotoboysFilters) {
    const skip = (filters.page - 1) * filters.limit
    const search = filters.search?.trim()

    const where: Prisma.UsuarioWhereInput = {
      role: 'ADMIN',
      ...(filters.excludeEmail
        ? { email: { not: filters.excludeEmail.toLowerCase().trim() } }
        : {}),
      ...(filters.excludeUserId ? { id: { not: filters.excludeUserId } } : {}),
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
        select: adminPublicSelect,
      }),
      prisma.usuario.count({ where }),
    ])

    return { data, total }
  },

  findAdminById(id: string) {
    return prisma.usuario.findFirst({
      where: { id, role: 'ADMIN' },
      select: adminPublicSelect,
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

  createAdmin(input: Pick<CreateUsuarioInput, 'nome' | 'email' | 'senhaHash'>) {
    return prisma.usuario.create({
      data: {
        nome: input.nome.trim(),
        email: input.email.toLowerCase().trim(),
        senhaHash: input.senhaHash,
        role: 'ADMIN',
        mustChangePassword: true,
      },
      select: adminPublicSelect,
    })
  },

  updateAdmin(
    id: string,
    data: {
      nome?: string
      email?: string
      senhaHash?: string
      mustChangePassword?: boolean
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
        ...(data.mustChangePassword !== undefined
          ? { mustChangePassword: data.mustChangePassword }
          : {}),
      },
      select: adminPublicSelect,
    })
  },

  updateMotoboy(
    id: string,
    data: {
      nome?: string
      email?: string
      senhaHash?: string
      pix?: string | null
      mustChangePassword?: boolean
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
        ...(data.mustChangePassword !== undefined
          ? { mustChangePassword: data.mustChangePassword }
          : {}),
      },
      select: motoboyPublicSelect,
    })
  },

  updatePassword(id: string, senhaHash: string) {
    return prisma.usuario.update({
      where: { id },
      data: {
        senhaHash,
        mustChangePassword: false,
      },
    })
  },

  updatePix(id: string, pix: string | null) {
    return prisma.usuario.update({
      where: { id },
      data: { pix },
      select: motoboyPublicSelect,
    })
  },

  updateFotoPerfil(id: string, fotoPerfil: string | null) {
    return prisma.usuario.update({
      where: { id },
      data: { fotoPerfil },
    })
  },

  setAtivo(id: string, ativo: boolean) {
    return prisma.usuario.update({
      where: { id },
      data: { ativo },
      select: motoboyPublicSelect,
    })
  },

  deleteMotoboy(id: string) {
    return prisma.usuario.delete({
      where: { id, role: 'MOTOBOY' },
      select: motoboyPublicSelect,
    })
  },

  deleteAdmin(id: string) {
    return prisma.usuario.delete({
      where: { id, role: 'ADMIN' },
      select: adminPublicSelect,
    })
  },

  countActiveAdmins(excludeId?: string) {
    return prisma.usuario.count({
      where: {
        role: 'ADMIN',
        ativo: true,
        ...(excludeId ? { id: { not: excludeId } } : {}),
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
        mustChangePassword: true,
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

  async findActiveAdminIds() {
    const admins = await prisma.usuario.findMany({
      where: { role: 'ADMIN', ativo: true },
      select: { id: true },
    })

    return admins.map((admin) => admin.id)
  },
}
