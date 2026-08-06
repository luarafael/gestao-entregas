import { describe, expect, it } from 'vitest'
import { sanitizeFilename } from './pdfDocument'
import { buildPrestacaoPdfFilename } from '@/features/accounting/utils/exportPrestacaoPdf'
import { buildReportPdfFilename } from '@/features/reports/utils/exportReportPdf'

describe('sanitizeFilename', () => {
  it('remove caracteres inválidos do nome do arquivo', () => {
    expect(sanitizeFilename('relatório: agosto/2026.pdf')).toBe(
      'relatório- agosto-2026.pdf',
    )
  })
})

describe('buildPrestacaoPdfFilename', () => {
  it('usa a data no nome do arquivo', () => {
    expect(buildPrestacaoPdfFilename('2026-08-05T00:00:00.000Z')).toBe(
      'prestacao-2026-08-05.pdf',
    )
  })
})

describe('buildReportPdfFilename', () => {
  it('inclui o período no nome do arquivo', () => {
    expect(buildReportPdfFilename('week')).toMatch(/^relatorio-week-\d{4}-\d{2}-\d{2}\.pdf$/)
  })
})
