import { prisma } from '../lib/prisma.js'
import { startOfDay } from '../utils/date.utils.js'

export interface CreatePrestacaoData {
  data: Date
  totalEntregas: number
  valorTotal: number
  valorPendencias: number
  valorFinal: number
  observacoes?: string
}

export class PrestacaoRepository {
  async create(data: CreatePrestacaoData) {
    return prisma.prestacaoContas.create({ data })
  }

  async findById(id: string) {
    return prisma.prestacaoContas.findUnique({ where: { id } })
  }

  async findByDate(date: Date) {
    return prisma.prestacaoContas.findUnique({
      where: { data: startOfDay(date) },
    })
  }

  async findMany(page: number, limit: number) {
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      prisma.prestacaoContas.findMany({
        skip,
        take: limit,
        orderBy: { data: 'desc' },
      }),
      prisma.prestacaoContas.count(),
    ])

    return { data, total }
  }
}

export const prestacaoRepository = new PrestacaoRepository()
