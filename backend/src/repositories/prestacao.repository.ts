import { prisma } from '../lib/prisma.js'
import { toUtcDateOnlyFromLocal } from '../utils/date.utils.js'

export interface CreatePrestacaoData {
  data: Date
  totalEntregas: number
  valorTotal: number
  valorPendencias: number
  valorFinal: number
  observacoes?: string
}

export interface UpdatePrestacaoData {
  totalEntregas?: number
  valorTotal?: number
  valorPendencias?: number
  valorFinal?: number
  observacoes?: string | null
}

export class PrestacaoRepository {
  async create(data: CreatePrestacaoData) {
    return prisma.prestacaoContas.create({
      data: {
        ...data,
        data: toUtcDateOnlyFromLocal(data.data),
      },
    })
  }

  async findById(id: string) {
    return prisma.prestacaoContas.findUnique({ where: { id } })
  }

  async findByDate(date: Date) {
    return prisma.prestacaoContas.findUnique({
      where: { data: toUtcDateOnlyFromLocal(date) },
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

  async update(id: string, data: UpdatePrestacaoData) {
    return prisma.prestacaoContas.update({ where: { id }, data })
  }

  async delete(id: string) {
    return prisma.prestacaoContas.delete({ where: { id } })
  }
}

export const prestacaoRepository = new PrestacaoRepository()
