import type { Prisma, StatusEntrega } from '../../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import { motoboyRelationSelect } from './motoboy-select.js'
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
  nomeCliente?: string
  origemCadastro?: 'MOTOBOY' | 'CLIENTE'
  excludeConcluidasEmRotas?: boolean
}

type EntregaStatsByDate = {
  totalEntregas: number
  valorTotal: number
  entregasPagasPeloCliente: number
  valorPagasPeloCliente: number
  valorProdutoTotal?: number
  valorEntregaMotoboyTotal?: number
  pedidosPagos?: number
  pedidosNaoPagos?: number
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
        motoboy: { select: motoboyRelationSelect },
      },
    })
  }

  async findById(id: string) {
    return prisma.entrega.findUnique({ where: { id } })
  }

  async findEntregaIdsConcluidasEmRotas() {
    const paradas = await prisma.rotaParada.findMany({
      where: {
        entregaId: { not: null },
        OR: [
          { rota: { concluidaEm: { not: null } } },
          { execucoes: { some: { status: 'ENTREGUE' } } },
        ],
      },
      select: { entregaId: true },
      distinct: ['entregaId'],
    })

    return paradas
      .map((parada) => parada.entregaId)
      .filter((id): id is string => Boolean(id))
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

    if (filters.origemCadastro) {
      where.origemCadastro = filters.origemCadastro
    }

    if (filters.nomeCliente) {
      where.nomeCliente = { equals: filters.nomeCliente, mode: 'insensitive' }
    }

    if (filters.search) {
      where.OR = [
        { nomeCliente: { contains: filters.search, mode: 'insensitive' } },
        { telefoneCliente: { contains: filters.search, mode: 'insensitive' } },
        { endereco: { contains: filters.search, mode: 'insensitive' } },
        { bairro: { contains: filters.search, mode: 'insensitive' } },
        { cidade: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.excludeConcluidasEmRotas) {
      const excludedIds = await this.findEntregaIdsConcluidasEmRotas()
      if (excludedIds.length > 0) {
        where.id = { notIn: excludedIds }
      }
    }

    const [data, total] = await Promise.all([
      prisma.entrega.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        include: {
          motoboy: { select: motoboyRelationSelect },
        },
      }),
      prisma.entrega.count({ where }),
    ])

    return { data, total }
  }

  async findDistinctClientes(filters: Omit<ListEntregasFilters, 'page' | 'limit' | 'sortBy' | 'sortOrder'>) {
    const reference = filters.referenceDate ?? new Date()
    const { start, end } = getUtcDateOnlyRange(filters.filter, reference)

    const where: Prisma.EntregaWhereInput = {
      data: { gte: start, lte: end },
      nomeCliente: { not: null },
      ...(filters.motoboyId ? { motoboyId: filters.motoboyId } : {}),
    }

    const rows = await prisma.entrega.findMany({
      where,
      select: { nomeCliente: true },
      distinct: ['nomeCliente'],
      orderBy: { nomeCliente: 'asc' },
    })

    return rows
      .map((row) => row.nomeCliente?.trim())
      .filter((nome): nome is string => Boolean(nome))
  }

  async findByDate(
    date: Date,
    filters?: { motoboyId?: string; nomeCliente?: string },
  ) {
    const day = toUtcDateOnly(formatDateOnlyISO(date))

    return prisma.entrega.findMany({
      where: {
        data: day,
        status: 'ENTREGUE',
        origemCadastro: 'MOTOBOY',
        ...(filters?.motoboyId ? { motoboyId: filters.motoboyId } : {}),
        ...(filters?.nomeCliente
          ? { nomeCliente: { equals: filters.nomeCliente, mode: 'insensitive' } }
          : {}),
      },
      orderBy: { horario: 'asc' },
      include: {
        motoboy: { select: motoboyRelationSelect },
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
        motoboy: { select: motoboyRelationSelect },
      },
    })
  }

  async findAllByDate(date: Date) {
    const day = toUtcDateOnly(formatDateOnlyISO(date))

    return prisma.entrega.findMany({
      where: { data: day },
      orderBy: { horario: 'asc' },
      include: {
        motoboy: { select: motoboyRelationSelect },
      },
    })
  }

  async findByIds(ids: string[]) {
    if (ids.length === 0) return []

    return prisma.entrega.findMany({
      where: { id: { in: ids } },
      include: {
        motoboy: { select: motoboyRelationSelect },
      },
    })
  }

  async createCliente(data: {
    nomeCliente: string
    telefoneCliente: string
    endereco: string
    cidade?: string
    valorProduto: number
    formaPagamento: 'DINHEIRO' | 'PIX' | 'CARTAO'
    statusPagamento: 'PAGO' | 'NAO_PAGO'
    valorEntregaMotoboy: number
    valorEntrega?: number
    observacao?: string
  }) {
    const now = new Date()

    return prisma.entrega.create({
      data: {
        nomeCliente: data.nomeCliente,
        telefoneCliente: data.telefoneCliente,
        endereco: data.endereco,
        bairro: '—',
        cidade: data.cidade,
        valorProduto: data.valorProduto,
        formaPagamento: data.formaPagamento,
        statusPagamentoCliente: data.statusPagamento,
        valorEntregaMotoboy: data.valorEntregaMotoboy,
        valorEntrega: data.valorEntrega ?? 0,
        observacao: data.observacao,
        origemCadastro: 'CLIENTE',
        data: toUtcDateOnlyFromBusinessTz(now),
        horario: now,
      },
    })
  }

  async updateCliente(
    id: string,
    data: Partial<{
      nomeCliente: string
      telefoneCliente: string
      endereco: string
      cidade: string | null
      valorProduto: number
      formaPagamento: 'DINHEIRO' | 'PIX' | 'CARTAO'
      statusPagamento: 'PAGO' | 'NAO_PAGO'
      valorEntregaMotoboy: number
      valorEntrega: number
      observacao: string | null
    }>,
  ) {
    const { statusPagamento, ...rest } = data

    const updated = await prisma.entrega.update({
      where: { id },
      data: {
        ...rest,
        ...(statusPagamento !== undefined
          ? { statusPagamentoCliente: statusPagamento }
          : {}),
      },
    })

    if (updated.entregaMotoboyId) {
      await prisma.entrega.update({
        where: { id: updated.entregaMotoboyId },
        data: {
          valorProduto: updated.valorProduto,
          formaPagamento: updated.formaPagamento,
          statusPagamentoCliente: updated.statusPagamentoCliente,
        },
      })
    }

    return updated
  }

  async linkEntregaMotoboy(clienteId: string, motoboyEntregaId: string) {
    return prisma.entrega.update({
      where: { id: clienteId },
      data: { entregaMotoboyId: motoboyEntregaId },
    })
  }

  async update(id: string, data: UpdateEntregaInput) {
    return prisma.entrega.update({ where: { id }, data })
  }

  async markDelivered(id: string, horario: Date) {
    return prisma.entrega.update({
      where: { id },
      data: {
        status: 'ENTREGUE',
        horario,
      },
    })
  }

  async updateStatusPagamento(id: string, status: 'PAGO' | 'NAO_PAGO') {
    const updated = await prisma.entrega.update({
      where: { id },
      data: { statusPagamentoCliente: status },
    })

    await prisma.entrega.updateMany({
      where: { entregaMotoboyId: id },
      data: { statusPagamentoCliente: status },
    })

    if (updated.entregaMotoboyId) {
      await prisma.entrega.update({
        where: { id: updated.entregaMotoboyId },
        data: { statusPagamentoCliente: status },
      })
    }

    return updated
  }

  async delete(id: string) {
    return prisma.entrega.delete({ where: { id } })
  }

  async findDistinctClientesByDate(date: Date) {
    const day = toUtcDateOnly(formatDateOnlyISO(date))

    const rows = await prisma.entrega.findMany({
      where: {
        data: day,
        status: 'ENTREGUE',
        nomeCliente: { not: null },
      },
      select: { nomeCliente: true },
      distinct: ['nomeCliente'],
      orderBy: { nomeCliente: 'asc' },
    })

    return rows
      .map((row) => row.nomeCliente?.trim())
      .filter((nome): nome is string => Boolean(nome))
  }

  async getStatsByDate(
    date: Date,
    filters?: {
      motoboyId?: string
      nomeCliente?: string
      origemCadastro?: 'MOTOBOY' | 'CLIENTE'
    },
  ): Promise<EntregaStatsByDate> {
    const day = toUtcDateOnly(formatDateOnlyISO(date))
    const baseWhere: Prisma.EntregaWhereInput = {
      data: day,
      status: 'ENTREGUE' as StatusEntrega,
      ...(filters?.origemCadastro
        ? { origemCadastro: filters.origemCadastro }
        : {}),
      ...(filters?.motoboyId ? { motoboyId: filters.motoboyId } : {}),
      ...(filters?.nomeCliente
        ? { nomeCliente: { equals: filters.nomeCliente, mode: 'insensitive' } }
        : {}),
    }

    if (filters?.origemCadastro === 'CLIENTE') {
      const [total, produto, entregaMotoboy, pagos, naoPagos] =
        await Promise.all([
          prisma.entrega.aggregate({
            where: baseWhere,
            _count: { id: true },
          }),
          prisma.entrega.aggregate({
            where: baseWhere,
            _sum: { valorProduto: true },
          }),
          prisma.entrega.aggregate({
            where: baseWhere,
            _sum: { valorEntregaMotoboy: true },
          }),
          prisma.entrega.aggregate({
            where: { ...baseWhere, statusPagamentoCliente: 'PAGO' },
            _count: { id: true },
          }),
          prisma.entrega.aggregate({
            where: { ...baseWhere, statusPagamentoCliente: 'NAO_PAGO' },
            _count: { id: true },
          }),
        ])

      const valorProdutoTotal = Number(produto._sum.valorProduto ?? 0)
      const valorEntregaMotoboyTotal = Number(
        entregaMotoboy._sum.valorEntregaMotoboy ?? 0,
      )

      return {
        totalEntregas: total._count.id,
        valorTotal: valorProdutoTotal + valorEntregaMotoboyTotal,
        valorProdutoTotal,
        valorEntregaMotoboyTotal,
        pedidosPagos: pagos._count.id,
        pedidosNaoPagos: naoPagos._count.id,
        entregasPagasPeloCliente: 0,
        valorPagasPeloCliente: 0,
      }
    }

    if (!filters?.origemCadastro) {
      const [motoboyStats, clientStats] = await Promise.all([
        this.getStatsByDate(date, {
          motoboyId: filters?.motoboyId,
          nomeCliente: filters?.nomeCliente,
          origemCadastro: 'MOTOBOY',
        }),
        this.getStatsByDate(date, {
          nomeCliente: filters?.nomeCliente,
          origemCadastro: 'CLIENTE',
        }),
      ])

      return {
        totalEntregas:
          motoboyStats.totalEntregas + clientStats.totalEntregas,
        valorTotal: motoboyStats.valorTotal + clientStats.valorTotal,
        valorProdutoTotal: clientStats.valorProdutoTotal ?? 0,
        valorEntregaMotoboyTotal: clientStats.valorEntregaMotoboyTotal ?? 0,
        pedidosPagos: clientStats.pedidosPagos ?? 0,
        pedidosNaoPagos: clientStats.pedidosNaoPagos ?? 0,
        entregasPagasPeloCliente: motoboyStats.entregasPagasPeloCliente,
        valorPagasPeloCliente: motoboyStats.valorPagasPeloCliente,
      }
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
      valorProdutoTotal: 0,
      valorEntregaMotoboyTotal: 0,
      pedidosPagos: 0,
      pedidosNaoPagos: 0,
    }
  }
}

export const entregaRepository = new EntregaRepository()
