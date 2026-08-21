import { prisma } from '../lib/prisma.js'
import { toUtcDateOnly, formatDateOnlyISO } from '../utils/date.utils.js'

export class PrestacaoClienteRepository {
  async create(data: {
    nomeCliente: string
    data: Date
    totalEntregas: number
    valorTotal: number
    valorFinal: number
    observacoes?: string | null
  }) {
    return prisma.prestacaoCliente.create({
      data: {
        nomeCliente: data.nomeCliente,
        data: data.data,
        totalEntregas: data.totalEntregas,
        valorTotal: data.valorTotal,
        valorFinal: data.valorFinal,
        observacoes: data.observacoes,
      },
    })
  }

  async findById(id: string) {
    return prisma.prestacaoCliente.findUnique({ where: { id } })
  }

  async findByClienteAndDate(nomeCliente: string, date: Date) {
    return prisma.prestacaoCliente.findUnique({
      where: {
        nomeCliente_data: {
          nomeCliente,
          data: toUtcDateOnly(formatDateOnlyISO(date)),
        },
      },
    })
  }

  async findMany(page: number, limit: number, nomeCliente?: string) {
    const skip = (page - 1) * limit
    const where = nomeCliente ? { nomeCliente } : undefined

    const [data, total] = await Promise.all([
      prisma.prestacaoCliente.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ data: 'desc' }, { criadoEm: 'desc' }],
      }),
      prisma.prestacaoCliente.count({ where }),
    ])

    return { data, total }
  }

  async findAllForHistorico(limit = 500) {
    return prisma.prestacaoCliente.findMany({
      take: limit,
      orderBy: [{ data: 'desc' }, { criadoEm: 'desc' }],
    })
  }

  async findCreatedSince(since: Date) {
    return prisma.prestacaoCliente.findMany({
      where: { criadoEm: { gt: since } },
      orderBy: { criadoEm: 'asc' },
      take: 50,
    })
  }

  async delete(id: string) {
    return prisma.prestacaoCliente.delete({ where: { id } })
  }

  async update(
    id: string,
    data: {
      totalEntregas?: number
      valorTotal?: number
      valorFinal?: number
      observacoes?: string | null
    },
  ) {
    return prisma.prestacaoCliente.update({ where: { id }, data })
  }
}

export const prestacaoClienteRepository = new PrestacaoClienteRepository()
