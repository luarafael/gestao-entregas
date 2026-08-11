import { prisma } from '../lib/prisma.js'
import type { ReportPeriod } from '../schemas/report.schema.js'
import { getValorRecebivelEntrega } from '../utils/entrega-valor.utils.js'
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

type EntregaReportFilters = {
  origemCadastro?: 'MOTOBOY' | 'CLIENTE'
  motoboyId?: string
}

function entregaDayValue(entrega: {
  origemCadastro: string
  valorEntrega: unknown
  valorProduto: unknown
  valorEntregaMotoboy: unknown
  pagoPeloCliente: boolean
  valorPagoCliente?: unknown | null
}) {
  if (entrega.origemCadastro === 'CLIENTE') {
    return (
      Number(entrega.valorProduto ?? 0) +
      Number(entrega.valorEntregaMotoboy ?? 0)
    )
  }

  return getValorRecebivelEntrega(entrega)
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
    origemCadastro?: 'MOTOBOY' | 'CLIENTE',
  ) {
    const { start, end } = getUtcDateOnlyRange(period, reference)
    const entregas = await prisma.entrega.findMany({
      where: {
        data: { gte: start, lte: end },
        status: 'ENTREGUE',
        ...(origemCadastro ? { origemCadastro } : {}),
        ...(motoboyId ? { motoboyId } : {}),
      },
      select: {
        bairro: true,
        origemCadastro: true,
        valorEntrega: true,
        valorProduto: true,
        valorEntregaMotoboy: true,
        pagoPeloCliente: true,
        valorPagoCliente: true,
      },
    })

    const byBairro = new Map<string, { entregas: number; valor: number }>()

    for (const entrega of entregas) {
      const current = byBairro.get(entrega.bairro) ?? { entregas: 0, valor: 0 }
      current.entregas += 1
      current.valor += entregaDayValue(entrega)
      byBairro.set(entrega.bairro, current)
    }

    return [...byBairro.entries()]
      .sort((a, b) => b[1].entregas - a[1].entregas)
      .slice(0, limit)
      .map(([bairro, stats]) => ({
        bairro,
        entregas: stats.entregas,
        valor: stats.valor,
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

  async getEntregasDailyBreakdown(
    period: ReportPeriod,
    reference = new Date(),
    filters: EntregaReportFilters = {},
  ) {
    const { start, end } = getUtcDateOnlyRange(period, reference)
    const entregas = await prisma.entrega.findMany({
      where: {
        data: { gte: start, lte: end },
        status: 'ENTREGUE',
        ...(filters.origemCadastro
          ? { origemCadastro: filters.origemCadastro }
          : {}),
        ...(filters.motoboyId ? { motoboyId: filters.motoboyId } : {}),
      },
      select: {
        data: true,
        origemCadastro: true,
        valorEntrega: true,
        valorProduto: true,
        valorEntregaMotoboy: true,
        pagoPeloCliente: true,
        valorPagoCliente: true,
      },
    })

    const totalsByDay = new Map<string, DayTotals>()

    for (const entrega of entregas) {
      const date = formatDateOnlyISO(entrega.data)
      const current = totalsByDay.get(date) ?? {
        entregas: 0,
        valor: 0,
        valorEntregas: 0,
        valorPendencias: 0,
        temPrestacao: false,
      }

      current.entregas += 1
      const dayValue = entregaDayValue(entrega)
      current.valor += dayValue
      current.valorEntregas += dayValue
      current.temPrestacao = true
      totalsByDay.set(date, current)
    }

    return iterateUtcDays(start, end).map((date) => {
      const totals = totalsByDay.get(date)

      return {
        date,
        entregas: totals?.entregas ?? 0,
        valor: totals?.valor ?? 0,
        valorEntregas: totals?.valorEntregas ?? 0,
        valorPendencias: 0,
        temPrestacao: totals?.temPrestacao ?? false,
      }
    })
  }

  async getEntregasPeriodSummary(
    period: ReportPeriod,
    reference = new Date(),
    filters: EntregaReportFilters = {},
  ) {
    const breakdown = await this.getEntregasDailyBreakdown(
      period,
      reference,
      filters,
    )
    const daysWithData = breakdown.filter((day) => day.entregas > 0)
    const totalEntregas = breakdown.reduce((sum, day) => sum + day.entregas, 0)
    const valorEntregas = breakdown.reduce((sum, day) => sum + day.valor, 0)
    const averages = calculatePeriodAverages(
      { totalEntregas, valorEntregas },
      daysWithData.length,
    )

    return {
      period,
      totalEntregas,
      valorEntregas,
      mediaEntregasPorDia: averages.mediaEntregasPorDia,
      mediaValorPorDia: averages.mediaValorPorDia,
      totalPrestacoes: daysWithData.length,
      valorFinalPrestacoes: valorEntregas,
      pendenciasAbertas: 0,
      valorPendenciasAbertas: 0,
    }
  }
}

export const reportRepository = new ReportRepository()
