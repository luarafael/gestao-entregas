import { formatCurrency } from '@/shared/utils/cn'
import { formatPrestacaoDate } from '../schemas/prestacao.schema'
import { WA } from './whatsappEmoji'

export interface DailyReportSummary {
  date: string
  totalEntregas: number
  valorTotal: number
  entregasPagasPeloCliente?: number
  valorPagasPeloCliente?: number
  valorPendencias: number
  valorFinal: number
  valorRepasseMotoboys?: number
  valorLiquido?: number
  totalPendencias?: number
}

export function formatDailyReportSummary(report: DailyReportSummary): string {
  const lines = [
    '',
    `${WA.chart} *Relatório diário*`,
    '',
    `${WA.clock} *Data:* ${formatPrestacaoDate(report.date)}`,
    `${WA.package} *Entregas:* ${report.totalEntregas}`,
    `${WA.bills} *Valor das entregas:* ${formatCurrency(report.valorTotal)}`,
  ]

  if (report.entregasPagasPeloCliente && report.entregasPagasPeloCliente > 0) {
    lines.push(
      `${WA.check} *Pagas pelo cliente (fora do total):* ${report.entregasPagasPeloCliente} — ${formatCurrency(report.valorPagasPeloCliente ?? 0)}`,
    )
  }

  lines.push(
    `${WA.hourglass} *Pendências do dia:* ${report.totalPendencias ?? 0}`,
    `${WA.warning} *Valor das pendências:* ${formatCurrency(report.valorPendencias)}`,
    `${WA.check} *Valor final (bruto):* ${formatCurrency(report.valorFinal)}`,
  )

  if (report.valorRepasseMotoboys && report.valorRepasseMotoboys > 0) {
    lines.push(
      `${WA.truck} *Repasse motoboys:* ${formatCurrency(report.valorRepasseMotoboys)}`,
    )
  }

  if (report.valorLiquido !== undefined) {
    lines.push(
      `${WA.bills} *Valor líquido:* ${formatCurrency(report.valorLiquido)}`,
    )
  }

  lines.push('---')

  return lines.join('\n')
}

export function buildWhatsAppMessage(
  baseText: string,
  includeDailyReport: boolean,
  dailyReport?: DailyReportSummary,
): string {
  if (!includeDailyReport || !dailyReport) {
    return baseText
  }

  return `${baseText}${formatDailyReportSummary(dailyReport)}`
}
