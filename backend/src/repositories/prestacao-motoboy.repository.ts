import type { StatusPrestacaoMotoboy } from '../../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import { formatDateOnlyISO, toUtcDateOnly } from '../utils/date.utils.js'

export interface CreatePrestacaoMotoboyData {
  motoboyId: string
  data: Date
  totalEntregas: number
  valorTotal: number
  valorPendencias: number
  valorFinal: number
  observacoes?: string
  status?: StatusPrestacaoMotoboy
}

export interface UpdatePrestacaoMotoboyData {
  totalEntregas?: number
  valorTotal?: number
  valorPendencias?: number
  valorFinal?: number
  observacoes?: string | null
  status?: StatusPrestacaoMotoboy
  motivoRejeicao?: string | null
  aprovadaEm?: Date | null
  rejeitadaEm?: Date | null
}

export class PrestacaoMotoboyRepository {
  async create(data: CreatePrestacaoMotoboyData) {
    return prisma.prestacaoMotoboy.create({
      data: {
        ...data,
        data: toUtcDateOnly(data.data),
      },
      include: {
        motoboy: { select: { id: true, nome: true, email: true } },
      },
    })
  }

  async findById(id: string) {
    return prisma.prestacaoMotoboy.findUnique({
      where: { id },
      include: {
        motoboy: { select: { id: true, nome: true, email: true } },
      },
    })
  }

  async findByMotoboyAndDate(motoboyId: string, date: Date) {
    return prisma.prestacaoMotoboy.findUnique({
      where: {
        motoboyId_data: {
          motoboyId,
          data: toUtcDateOnly(formatDateOnlyISO(date)),
        },
      },
      include: {
        motoboy: { select: { id: true, nome: true, email: true } },
      },
    })
  }

  async findMany(filters: {
    page: number
    limit: number
    motoboyId?: string
    status?: StatusPrestacaoMotoboy
  }) {
    const skip = (filters.page - 1) * filters.limit
    const where = {
      ...(filters.motoboyId ? { motoboyId: filters.motoboyId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    }

    const [data, total] = await Promise.all([
      prisma.prestacaoMotoboy.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { data: 'desc' },
        include: {
          motoboy: { select: { id: true, nome: true, email: true } },
        },
      }),
      prisma.prestacaoMotoboy.count({ where }),
    ])

    return { data, total }
  }

  async countPending() {
    return prisma.prestacaoMotoboy.count({ where: { status: 'ENVIADA' } })
  }

  async findByDate(date: Date, status?: StatusPrestacaoMotoboy) {
    const day = toUtcDateOnly(formatDateOnlyISO(date))

    return prisma.prestacaoMotoboy.findMany({
      where: {
        data: day,
        ...(status ? { status } : {}),
      },
      orderBy: { motoboy: { nome: 'asc' } },
      include: {
        motoboy: { select: { id: true, nome: true, email: true } },
      },
    })
  }

  async countPendingByDate(date: Date) {
    const day = toUtcDateOnly(formatDateOnlyISO(date))

    return prisma.prestacaoMotoboy.count({
      where: { data: day, status: 'ENVIADA' },
    })
  }

  async linkApprovedToPrestacaoContas(date: Date, prestacaoContasId: string) {
    const day = toUtcDateOnly(formatDateOnlyISO(date))

    return prisma.prestacaoMotoboy.updateMany({
      where: { data: day, status: 'APROVADA' },
      data: { prestacaoContasId },
    })
  }

  async update(id: string, data: UpdatePrestacaoMotoboyData) {
    return prisma.prestacaoMotoboy.update({
      where: { id },
      data,
      include: {
        motoboy: { select: { id: true, nome: true, email: true } },
      },
    })
  }
}

export const prestacaoMotoboyRepository = new PrestacaoMotoboyRepository()
