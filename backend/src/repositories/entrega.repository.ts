import type { Prisma, StatusEntrega } from '../../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import type { DateFilter } from '../utils/date.utils.js'
import { getUtcDateOnlyRange, toUtcDateOnly, toUtcDateOnlyFromBusinessTz, formatDateOnlyISO } from '../utils/date.utils.js'
import type { CreateEntregaInput, UpdateEntregaInput } from '../schemas/entrega.schema.js'

export interface ListEntregasFilters {
  page: number
  limit: number
  search?: string
  filter: DateFilter
  referenceDate?: string
  sortBy: 'horario' | 'nomeCliente' | 'bairro' | 'valorEntrega'
  sortOrder: 'asc' | 'desc'
  motoboyId?: string
}

export class EntregaRepository {
  async create(
    data: Omit<CreateEntregaInput, 'motoboyId'>,
    motoboyId?: string,
  ) {
    const now = new Date()

    return prisma.entrega.create({
      data: {
        ...data,
        motoboyId,
        data: toUtcDateOnlyFromBusinessTz(now),
        horario: now,
      },
      include: {
        motoboy: { select: { id: true, nome: true } },
      },
    })
  }

  async findById(id: string) {
    return prisma.entrega.findUnique({ where: { id } })
  }

  async findMany(filters: ListEntregasFilters) {
    const reference = filters.referenceDate ?? new Date()
    const { start, end } = getUtcDateOnlyRange(filters.filter, reference)
    const skip = (filters.page - 1) * filters.limit

    const where: Prisma.EntregaWhereInput = {
      data: { gte: start, lte: end },
    }

    if (filters.motoboyId) {
      where.motoboyId = filters.motoboyId
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
        include: {
          motoboy: { select: { id: true, nome: true } },
        },
      }),
      prisma.entrega.count({ where }),
    ])

    return { data, total }
  }

  async findByDate(date: Date, motoboyId?: string) {
    const day = toUtcDateOnly(formatDateOnlyISO(date))

    return prisma.entrega.findMany({
      where: {
        data: day,
        status: 'ENTREGUE',
        ...(motoboyId ? { motoboyId } : {}),
      },
      orderBy: { horario: 'asc' },
      include: {
        motoboy: { select: { id: true, nome: true } },
      },
    })
  }

  async findRecentByDate(date: Date, limit = 50) {
    const day = toUtcDateOnly(formatDateOnlyISO(date))

    return prisma.entrega.findMany({
      where: {
        data: day,
        status: 'ENTREGUE',
      },
      orderBy: { horario: 'desc' },
      take: limit,
      include: {
        motoboy: { select: { id: true, nome: true } },
      },
    })
  }

  async findAllByDate(date: Date) {
    const day = toUtcDateOnly(formatDateOnlyISO(date))

    return prisma.entrega.findMany({
      where: { data: day },
      orderBy: { horario: 'asc' },
      include: {
        motoboy: { select: { id: true, nome: true } },
      },
    })
  }

  async update(id: string, data: UpdateEntregaInput) {
    return prisma.entrega.update({ where: { id }, data })
  }

  async delete(id: string) {
    return prisma.entrega.delete({ where: { id } })
  }

  async getStatsByDate(date: Date, motoboyId?: string) {
    const day = toUtcDateOnly(formatDateOnlyISO(date))
    const baseWhere: Prisma.EntregaWhereInput = {
      data: day,
      status: 'ENTREGUE' as StatusEntrega,
      ...(motoboyId ? { motoboyId } : {}),
    }

    const [total, billable, paidByClient] = await Promise.all([
      prisma.entrega.aggregate({
        where: baseWhere,
        _count: { id: true },
      }),
      prisma.entrega.aggregate({
        where: { ...baseWhere, pagoPeloCliente: false },
        _sum: { valorEntrega: true },
      }),
      prisma.entrega.aggregate({
        where: { ...baseWhere, pagoPeloCliente: true },
        _count: { id: true },
        _sum: { valorEntrega: true },
      }),
    ])

    return {
      totalEntregas: total._count.id,
      valorTotal: Number(billable._sum.valorEntrega ?? 0),
      entregasPagasPeloCliente: paidByClient._count.id,
      valorPagasPeloCliente: Number(paidByClient._sum.valorEntrega ?? 0),
    }
  }
}

export const entregaRepository = new EntregaRepository()
