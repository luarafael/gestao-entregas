import { formatCurrency } from '@/shared/utils/cn'
import { formatPrestacaoDate } from '../schemas/prestacao.schema'
import { WA } from './whatsappEmoji'

export interface DailyReportSummary {
  date: string
  totalEntregas: number
  valorTotal: number
  valorPendencias: number
  valorFinal: number
  totalPendencias?: number
}

export function formatDailyReportSummary(report: DailyReportSummary): string {
  return [
    '',
    `${WA.chart} *Relatório diário*`,
    '',
    `${WA.clock} *Data:* ${formatPrestacaoDate(report.date)}`,
    `${WA.package} *Entregas:* ${report.totalEntregas}`,
    `${WA.bills} *Valor das entregas:* ${formatCurrency(report.valorTotal)}`,
    `${WA.hourglass} *Pendências do dia:* ${report.totalPendencias ?? 0}`,
    `${WA.warning} *Valor das pendências:* ${formatCurrency(report.valorPendencias)}`,
    `${WA.check} *Valor final:* ${formatCurrency(report.valorFinal)}`,
    '---',
  ].join('\n')
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
