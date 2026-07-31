import type { StatusEntrega } from '../../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import type { ReportPeriod } from '../schemas/report.schema.js'
import {
  formatDateOnlyISO,
  getLastDaysUtcRange,
  getUtcDateOnlyRange,
} from '../utils/date.utils.js'

export class ReportRepository {
  async getDailyTrend(days: number, reference = new Date()) {
    const { start, end } = getLastDaysUtcRange(days, reference)

    const entregas = await prisma.entrega.findMany({
      where: {
        data: { gte: start, lte: end },
        status: 'ENTREGUE' as StatusEntrega,
      },
      select: {
        data: true,
        valorEntrega: true,
      },
    })

    const totalsByDay = new Map<string, { entregas: number; valor: number }>()

    for (const entrega of entregas) {
      const key = formatDateOnlyISO(entrega.data)
      const current = totalsByDay.get(key) ?? { entregas: 0, valor: 0 }
      current.entregas += 1
      current.valor += Number(entrega.valorEntrega)
      totalsByDay.set(key, current)
    }

    const result = []
    const cursor = new Date(start)

    for (let index = 0; index < days; index += 1) {
      const date = formatDateOnlyISO(cursor)
      const totals = totalsByDay.get(date) ?? { entregas: 0, valor: 0 }

      result.push({
        date,
        entregas: totals.entregas,
        valor: totals.valor,
      })

      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }

    return result
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

  async getPrestacaoTrend(days: number, reference = new Date()) {
    const { start, end } = getLastDaysUtcRange(days, reference)

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

    const [entregaStats, prestacaoStats, pendenciaStats] = await Promise.all([
      prisma.entrega.aggregate({
        where: {
          data: { gte: start, lte: end },
          status: 'ENTREGUE' as StatusEntrega,
        },
        _count: { id: true },
        _sum: { valorEntrega: true },
      }),
      prisma.prestacaoContas.aggregate({
        where: {
          data: { gte: start, lte: end },
        },
        _count: { id: true },
        _sum: { valorFinal: true },
      }),
      prisma.pendencia.aggregate({
        where: { status: 'PENDENTE' },
        _count: { id: true },
        _sum: { valor: true },
      }),
    ])

    const totalEntregas = entregaStats._count.id
    const valorEntregas = Number(entregaStats._sum.valorEntrega ?? 0)
    const daysInPeriod =
      Math.max(
        1,
        Math.round(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1,
      )

    return {
      period,
      totalEntregas,
      valorEntregas,
      mediaEntregasPorDia: Number((totalEntregas / daysInPeriod).toFixed(1)),
      mediaValorPorDia: Number((valorEntregas / daysInPeriod).toFixed(2)),
      totalPrestacoes: prestacaoStats._count.id,
      valorFinalPrestacoes: Number(prestacaoStats._sum.valorFinal ?? 0),
      pendenciasAbertas: pendenciaStats._count.id,
      valorPendenciasAbertas: Number(pendenciaStats._sum.valor ?? 0),
    }
  }
}

export const reportRepository = new ReportRepository()
