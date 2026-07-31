import type { StatusEntrega } from '../../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import type { ReportPeriod } from '../schemas/report.schema.js'
import {
  formatDateOnlyISO,
  getUtcDateOnlyRange,
} from '../utils/date.utils.js'

function countDaysInRange(start: Date, end: Date) {
  return (
    Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    ) + 1
  )
}

function iterateUtcDays(start: Date, end: Date) {
  const days: string[] = []
  const cursor = new Date(start)

  while (cursor.getTime() <= end.getTime()) {
    days.push(formatDateOnlyISO(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return days
}

export class ReportRepository {
  async getPeriodDailyBreakdown(period: ReportPeriod, reference = new Date()) {
    const { start, end } = getUtcDateOnlyRange(period, reference)

    const prestacoes = await prisma.prestacaoContas.findMany({
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

    const totalsByDay = new Map<
      string,
      {
        entregas: number
        valor: number
        valorEntregas: number
        valorPendencias: number
        temPrestacao: boolean
      }
    >()

    for (const prestacao of prestacoes) {
      const key = formatDateOnlyISO(prestacao.data)
      totalsByDay.set(key, {
        entregas: prestacao.totalEntregas,
        valor: Number(prestacao.valorFinal),
        valorEntregas: Number(prestacao.valorTotal),
        valorPendencias: Number(prestacao.valorPendencias),
        temPrestacao: true,
      })
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
  ) {
    const { start, end } = getUtcDateOnlyRange(period, reference)

    const grouped = await prisma.entrega.groupBy({
      by: ['bairro'],
      where: {
        data: { gte: start, lte: end },
        status: 'ENTREGUE' as StatusEntrega,
      },
      _count: { id: true },
      _sum: { valorEntrega: true },
      orderBy: {
        _count: { id: 'desc' },
      },
      take: limit,
    })

    return grouped.map((item) => ({
      bairro: item.bairro,
      entregas: item._count.id,
      valor: Number(item._sum.valorEntrega ?? 0),
    }))
  }

  async getPrestacaoTrend(period: ReportPeriod, reference = new Date()) {
    const { start, end } = getUtcDateOnlyRange(period, reference)

    const prestacoes = await prisma.prestacaoContas.findMany({
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

  async getPeriodSummary(period: ReportPeriod, reference = new Date()) {
    const { start, end } = getUtcDateOnlyRange(period, reference)

    const [prestacoes, pendenciaStats] = await Promise.all([
      prisma.prestacaoContas.findMany({
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
        where: { status: 'PENDENTE' },
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
    const daysInPeriod = countDaysInRange(start, end)

    return {
      period,
      totalEntregas,
      valorEntregas,
      mediaEntregasPorDia: Number((totalEntregas / daysInPeriod).toFixed(1)),
      mediaValorPorDia: Number((valorFinalPrestacoes / daysInPeriod).toFixed(2)),
      totalPrestacoes: prestacoes.length,
      valorFinalPrestacoes,
      pendenciasAbertas: pendenciaStats._count.id,
      valorPendenciasAbertas: Number(pendenciaStats._sum.valor ?? 0),
    }
  }
}

export const reportRepository = new ReportRepository()
