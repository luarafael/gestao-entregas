import type {
  DailyTrendPoint,
  NeighborhoodReportPoint,
  ReportPeriod,
  ReportSummary,
} from '@/shared/types/api.types'
import { formatCurrency } from '@/shared/utils/cn'
import { formatDateBR } from '@/shared/utils/format'
import {
  addGeneratedAtFooter,
  addKeyValueRow,
  addSectionTitle,
  addTableHeader,
  addTableRow,
  createPdfWithHeader,
  PDF_MARGIN,
  savePdf,
} from '@/shared/utils/pdf/pdfDocument'
import { getPeriodLabel } from './chart.utils'

export interface ReportPdfInput {
  period: ReportPeriod
  summary: ReportSummary
  dailyBreakdown: DailyTrendPoint[]
  neighborhoods: NeighborhoodReportPoint[]
  scopeLabel?: string
}

export function buildReportPdfFilename(period: ReportPeriod) {
  const today = new Date().toISOString().slice(0, 10)
  return `relatorio-${period}-${today}.pdf`
}

export function exportReportPdf(input: ReportPdfInput) {
  const periodLabel = getPeriodLabel(input.period)
  const scopeSuffix = input.scopeLabel ? ` — ${input.scopeLabel}` : ''
  const { doc, y: startY } = createPdfWithHeader(
    `Relatório — ${periodLabel}${scopeSuffix}`,
  )
  let y = startY
  const rightX = doc.internal.pageSize.getWidth() - PDF_MARGIN

  y = addSectionTitle(doc, y, 'Resumo do período')
  y = addKeyValueRow(
    doc,
    y,
    'Entregas',
    String(input.summary.totalEntregas),
  )
  y = addKeyValueRow(
    doc,
    y,
    'Valor das entregas',
    formatCurrency(input.summary.valorEntregas),
  )
  y = addKeyValueRow(
    doc,
    y,
    'Média diária (entregas)',
    String(input.summary.mediaEntregasPorDia),
  )
  y = addKeyValueRow(
    doc,
    y,
    'Prestações geradas',
    String(input.summary.totalPrestacoes),
  )
  y = addKeyValueRow(
    doc,
    y,
    'Valor final (prestações)',
    formatCurrency(input.summary.valorFinalPrestacoes),
  )
  y = addKeyValueRow(
    doc,
    y,
    'Pendências abertas',
    String(input.summary.pendenciasAbertas),
  )
  y = addKeyValueRow(
    doc,
    y,
    'Valor pendências abertas',
    formatCurrency(input.summary.valorPendenciasAbertas),
  )
  y = addKeyValueRow(
    doc,
    y,
    'Média valor/dia',
    formatCurrency(input.summary.mediaValorPorDia),
  )

  const dailyRows = input.dailyBreakdown.filter((row) => row.temPrestacao)

  if (dailyRows.length > 0) {
    y += 2
    y = addSectionTitle(doc, y, 'Detalhamento diário')
    y = addTableHeader(doc, y, [
      { label: 'Data', x: PDF_MARGIN },
      { label: 'Entregas', x: rightX - 50, align: 'right' },
      { label: 'Valor final', x: rightX, align: 'right' },
    ])

    for (const row of dailyRows) {
      y = addTableRow(doc, y, [
        { text: formatDateBR(row.date), x: PDF_MARGIN },
        { text: String(row.entregas), x: rightX - 50, align: 'right' },
        { text: formatCurrency(row.valor), x: rightX, align: 'right' },
      ])
    }
  }

  if (input.neighborhoods.length > 0) {
    y += 2
    y = addSectionTitle(doc, y, 'Top bairros')
    y = addTableHeader(doc, y, [
      { label: 'Bairro', x: PDF_MARGIN },
      { label: 'Entregas', x: rightX - 50, align: 'right' },
      { label: 'Valor', x: rightX, align: 'right' },
    ])

    for (const row of input.neighborhoods) {
      y = addTableRow(doc, y, [
        { text: row.bairro, x: PDF_MARGIN },
        { text: String(row.entregas), x: rightX - 50, align: 'right' },
        { text: formatCurrency(row.valor), x: rightX, align: 'right' },
      ])
    }
  }

  addGeneratedAtFooter(doc, y)
  savePdf(doc, buildReportPdfFilename(input.period))
}
