import type { ReportPeriod } from '../schemas/report.schema.js'
import { formatDateOnlyISO, getUtcDateOnlyRange } from './date.utils.js'

export function iterateUtcDays(start: Date, end: Date) {
  const days: string[] = []
  const cursor = new Date(start)

  while (cursor.getTime() <= end.getTime()) {
    days.push(formatDateOnlyISO(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return days
}

/** Dias corridos no período selecionado (seg→hoje na semana, dia 1→hoje no mês). */
export function countCalendarDaysInPeriod(
  period: ReportPeriod,
  reference = new Date(),
) {
  const { start, end } = getUtcDateOnlyRange(period, reference)
  return iterateUtcDays(start, end).length
}

export function calculatePeriodAverages(
  totals: {
    totalEntregas: number
    valorEntregas: number
  },
  prestacoesCount: number,
) {
  if (prestacoesCount === 0) {
    return {
      mediaEntregasPorDia: 0,
      mediaValorPorDia: 0,
    }
  }

  const divisor = prestacoesCount

  return {
    mediaEntregasPorDia: Number((totals.totalEntregas / divisor).toFixed(1)),
    mediaValorPorDia: Number((totals.valorEntregas / divisor).toFixed(2)),
  }
}
