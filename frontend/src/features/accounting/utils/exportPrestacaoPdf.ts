import { formatCurrency } from '@/shared/utils/cn'
import {
  addGeneratedAtFooter,
  addKeyValueRow,
  addParagraph,
  addSectionTitle,
  createPdfWithHeader,
  savePdf,
} from '@/shared/utils/pdf/pdfDocument'
import { formatPrestacaoDate } from '../schemas/prestacao.schema'
import type { DailyReportSummary } from './whatsappMessage'

export interface PrestacaoPdfInput extends DailyReportSummary {
  observacoes?: string | null
}

export function buildPrestacaoPdfFilename(date: string) {
  return `prestacao-${date.slice(0, 10)}.pdf`
}

export function exportPrestacaoPdf(data: PrestacaoPdfInput) {
  const { doc, y: startY } = createPdfWithHeader('Prestação de Contas')
  let y = startY

  y = addKeyValueRow(doc, y, 'Data', formatPrestacaoDate(data.date))
  y = addKeyValueRow(doc, y, 'Entregas', String(data.totalEntregas))
  y = addKeyValueRow(
    doc,
    y,
    'Valor das entregas',
    formatCurrency(data.valorTotal),
  )

  if (data.entregasPagasPeloCliente && data.entregasPagasPeloCliente > 0) {
    y = addKeyValueRow(
      doc,
      y,
      'Pagas pelo cliente',
      `${data.entregasPagasPeloCliente} — ${formatCurrency(data.valorPagasPeloCliente ?? 0)} (fora do total)`,
      58,
    )
  }

  y = addKeyValueRow(
    doc,
    y,
    'Pendências do dia',
    String(data.totalPendencias ?? 0),
  )
  y = addKeyValueRow(
    doc,
    y,
    'Valor das pendências',
    formatCurrency(data.valorPendencias),
  )
  y = addKeyValueRow(doc, y, 'Valor final', formatCurrency(data.valorFinal))

  if (data.observacoes?.trim()) {
    y += 2
    y = addSectionTitle(doc, y, 'Observações')
    y = addParagraph(doc, y, data.observacoes.trim())
  }

  addGeneratedAtFooter(doc, y)
  savePdf(doc, buildPrestacaoPdfFilename(data.date))
}
