import type { Prisma, StatusEntrega } from '../../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import type { DateFilter } from '../utils/date.utils.js'
import { getUtcDateOnlyRange, toUtcDateOnly, toUtcDateOnlyFromLocal, formatDateOnlyISO } from '../utils/date.utils.js'
import type { CreateEntregaInput, UpdateEntregaInput } from '../schemas/entrega.schema.js'

export interface ListEntregasFilters {
  page: number
  limit: number
  search?: string
  filter: DateFilter
  sortBy: 'horario' | 'nomeCliente' | 'bairro' | 'valorEntrega'
  sortOrder: 'asc' | 'desc'
}

export class EntregaRepository {
  async create(data: CreateEntregaInput) {
    const now = new Date()

    return prisma.entrega.create({
      data: {
        ...data,
        data: toUtcDateOnlyFromLocal(now),
        horario: now,
      },
    })
  }

  async findById(id: string) {
    return prisma.entrega.findUnique({ where: { id } })
  }

  async findMany(filters: ListEntregasFilters) {
    const { start, end } = getUtcDateOnlyRange(filters.filter)
    const skip = (filters.page - 1) * filters.limit

    const where: Prisma.EntregaWhereInput = {
      data: { gte: start, lte: end },
    }

    if (filters.search) {
      where.OR = [
        { nomeCliente: { contains: filters.search, mode: 'insensitive' } },
        { endereco: { contains: filters.search, mode: 'insensitive' } },
        { bairro: { contains: filters.search, mode: 'insensitive' } },
        { cidade: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.entrega.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { [filters.sortBy]: filters.sortOrder },
      }),
      prisma.entrega.count({ where }),
    ])

    return { data, total }
  }

  async findByDate(date: Date) {
    const day = toUtcDateOnly(formatDateOnlyISO(date))

    return prisma.entrega.findMany({
      where: {
        data: day,
        status: 'ENTREGUE',
      },
      orderBy: { horario: 'asc' },
    })
  }

  async update(id: string, data: UpdateEntregaInput) {
    return prisma.entrega.update({ where: { id }, data })
  }

  async delete(id: string) {
    return prisma.entrega.delete({ where: { id } })
  }

  async getStatsByDate(date: Date) {
    const day = toUtcDateOnly(formatDateOnlyISO(date))

    const result = await prisma.entrega.aggregate({
      where: {
        data: day,
        status: 'ENTREGUE' as StatusEntrega,
      },
      _count: { id: true },
      _sum: { valorEntrega: true },
    })

    return {
      totalEntregas: result._count.id,
      valorTotal: Number(result._sum.valorEntrega ?? 0),
    }
  }
}

export const entregaRepository = new EntregaRepository()
