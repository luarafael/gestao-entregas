import type { StatusEntrega } from '../../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import type { ReportPeriod } from '../schemas/report.schema.js'
import {
  formatDateOnlyISO,
  getUtcDateOnlyRange,
} from '../utils/date.utils.js'
import {
  calculatePeriodAverages,
  iterateUtcDays,
} from '../utils/report.utils.js'

type DayTotals = {
  entregas: number
  valor: number
  valorEntregas: number
  valorPendencias: number
  temPrestacao: boolean
}

function toDayTotals(item: {
  totalEntregas: number
  valorTotal: unknown
  valorPendencias: unknown
  valorFinal: unknown
}): DayTotals {
  return {
    entregas: item.totalEntregas,
    valor: Number(item.valorFinal),
    valorEntregas: Number(item.valorTotal),
    valorPendencias: Number(item.valorPendencias),
    temPrestacao: true,
  }
}

export class ReportRepository {
  async getPeriodDailyBreakdown(
    period: ReportPeriod,
    reference = new Date(),
    motoboyId?: string,
  ) {
    const { start, end } = getUtcDateOnlyRange(period, reference)

    const prestacoes = motoboyId
      ? await prisma.prestacaoMotoboy.findMany({
          where: {
            motoboyId,
            data: { gte: start, lte: end },
          },
          orderBy: { data: 'asc' },
          select: {
            data: true,
            totalEntregas: true,
            valorTotal: true,
            valorPendencias: true,
            valorFinal: true,
          },
        })
      : await prisma.prestacaoContas.findMany({
          where: {
            data: { gte: start, lte: end },
          },
          orderBy: { data: 'asc' },
          select: {
            data: true,
            totalEntregas: true,
            valorTotal: true,
            valorPendencias: true,
            valorFinal: true,
          },
        })

    const totalsByDay = new Map<string, DayTotals>()

    for (const prestacao of prestacoes) {
      totalsByDay.set(formatDateOnlyISO(prestacao.data), toDayTotals(prestacao))
    }

    return iterateUtcDays(start, end).map((date) => {
      const totals = totalsByDay.get(date)

      return {
        date,
        entregas: totals?.entregas ?? 0,
        valor: totals?.valor ?? 0,
        valorEntregas: totals?.valorEntregas ?? 0,
        valorPendencias: totals?.valorPendencias ?? 0,
        temPrestacao: totals?.temPrestacao ?? false,
      }
    })
  }

  async getByNeighborhood(
    period: ReportPeriod,
    limit: number,
    reference = new Date(),
    motoboyId?: string,
  ) {
    const { start, end } = getUtcDateOnlyRange(period, reference)
    const baseWhere = {
      data: { gte: start, lte: end },
      status: 'ENTREGUE' as StatusEntrega,
      ...(motoboyId ? { motoboyId } : {}),
    }

    const grouped = await prisma.entrega.groupBy({
      by: ['bairro'],
      where: baseWhere,
      _count: { id: true },
      orderBy: {
        _count: { id: 'desc' },
      },
      take: limit,
    })

    const groupedValor = await prisma.entrega.groupBy({
      by: ['bairro'],
      where: {
        ...baseWhere,
        pagoPeloCliente: false,
      },
      _sum: { valorEntrega: true },
    })

    const valorByBairro = new Map(
      groupedValor.map((item) => [
        item.bairro,
        Number(item._sum.valorEntrega ?? 0),
      ]),
    )

    return grouped.map((item) => ({
      bairro: item.bairro,
      entregas: item._count.id,
      valor: valorByBairro.get(item.bairro) ?? 0,
    }))
  }

  async getPrestacaoTrend(
    period: ReportPeriod,
    reference = new Date(),
    motoboyId?: string,
  ) {
    const { start, end } = getUtcDateOnlyRange(period, reference)

    const prestacoes = motoboyId
      ? await prisma.prestacaoMotoboy.findMany({
          where: {
            motoboyId,
            data: { gte: start, lte: end },
          },
          orderBy: { data: 'asc' },
          select: {
            data: true,
            valorFinal: true,
            totalEntregas: true,
          },
        })
      : await prisma.prestacaoContas.findMany({
          where: {
            data: { gte: start, lte: end },
          },
          orderBy: { data: 'asc' },
          select: {
            data: true,
            valorFinal: true,
            totalEntregas: true,
          },
        })

    return prestacoes.map((prestacao) => ({
      date: formatDateOnlyISO(prestacao.data),
      valorFinal: Number(prestacao.valorFinal),
      totalEntregas: prestacao.totalEntregas,
    }))
  }

  async getPeriodSummary(
    period: ReportPeriod,
    reference = new Date(),
    motoboyId?: string,
  ) {
    const { start, end } = getUtcDateOnlyRange(period, reference)

    const [prestacoes, pendenciaStats] = await Promise.all([
      motoboyId
        ? prisma.prestacaoMotoboy.findMany({
            where: {
              motoboyId,
              data: { gte: start, lte: end },
            },
            select: {
              totalEntregas: true,
              valorTotal: true,
              valorFinal: true,
            },
          })
        : prisma.prestacaoContas.findMany({
            where: {
              data: { gte: start, lte: end },
            },
            select: {
              totalEntregas: true,
              valorTotal: true,
              valorFinal: true,
            },
          }),
      prisma.pendencia.aggregate({
        where: {
          status: 'PENDENTE',
          ...(motoboyId ? { motoboyId } : {}),
        },
        _count: { id: true },
        _sum: { valor: true },
      }),
    ])

    const totalEntregas = prestacoes.reduce(
      (sum, prestacao) => sum + prestacao.totalEntregas,
      0,
    )
    const valorEntregas = prestacoes.reduce(
      (sum, prestacao) => sum + Number(prestacao.valorTotal),
      0,
    )
    const valorFinalPrestacoes = prestacoes.reduce(
      (sum, prestacao) => sum + Number(prestacao.valorFinal),
      0,
    )
    const averages = calculatePeriodAverages(
      { totalEntregas, valorEntregas },
      prestacoes.length,
    )

    return {
      period,
      totalEntregas,
      valorEntregas,
      mediaEntregasPorDia: averages.mediaEntregasPorDia,
      mediaValorPorDia: averages.mediaValorPorDia,
      totalPrestacoes: prestacoes.length,
      valorFinalPrestacoes,
      pendenciasAbertas: pendenciaStats._count.id,
      valorPendenciasAbertas: Number(pendenciaStats._sum.valor ?? 0),
    }
  }
}

export const reportRepository = new ReportRepository()
