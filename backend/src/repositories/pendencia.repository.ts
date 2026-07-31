import type { Prisma, StatusPendencia } from '../../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import { startOfDay, endOfDay } from '../utils/date.utils.js'
import type {
  CreatePendenciaInput,
  UpdatePendenciaInput,
} from '../schemas/pendencia.schema.js'

export interface ListPendenciasFilters {
  page: number
  limit: number
  search?: string
  status?: StatusPendencia
}

export class PendenciaRepository {
  async create(data: CreatePendenciaInput) {
    return prisma.pendencia.create({ data })
  }

  async findById(id: string) {
    return prisma.pendencia.findUnique({ where: { id } })
  }

  async findMany(filters: ListPendenciasFilters) {
    const skip = (filters.page - 1) * filters.limit

    const where: Prisma.PendenciaWhereInput = {}

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.search) {
      where.descricao = { contains: filters.search, mode: 'insensitive' }
    }

    const [data, total] = await Promise.all([
      prisma.pendencia.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { criadoEm: 'desc' },
      }),
      prisma.pendencia.count({ where }),
    ])

    return { data, total }
  }

  async findPendingByDate(date: Date) {
    const start = startOfDay(date)
    const end = endOfDay(date)

    return prisma.pendencia.findMany({
      where: {
        referenteAoDia: { gte: start, lte: end },
        status: 'PENDENTE',
      },
      orderBy: { criadoEm: 'asc' },
    })
  }

  async getPendingTotal() {
    const result = await prisma.pendencia.aggregate({
      where: { status: 'PENDENTE' },
      _count: { id: true },
      _sum: { valor: true },
    })

    return {
      totalPendencias: result._count.id,
      valorPendencias: Number(result._sum.valor ?? 0),
    }
  }

  async update(id: string, data: UpdatePendenciaInput) {
    return prisma.pendencia.update({ where: { id }, data })
  }

  async delete(id: string) {
    return prisma.pendencia.delete({ where: { id } })
  }
}

export const pendenciaRepository = new PendenciaRepository()
