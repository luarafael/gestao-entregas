import { describe, it, expect } from 'vitest'
import { buildWhatsAppMessage, formatDailyReportSummary } from './whatsappMessage'

describe('whatsappMessage', () => {
  const report = {
    date: '2026-07-31',
    totalEntregas: 2,
    valorTotal: 100,
    valorPendencias: 25,
    valorFinal: 125,
    totalPendencias: 1,
  }

  it('formata resumo do relatório diário', () => {
    const text = formatDailyReportSummary(report)

    expect(text).toContain('Relatório diário')
    expect(text).toContain('🕐')
    expect(text).toContain('31/07/2026')
    expect(text).toContain('📦')
    expect(text).toContain('*Entregas:* 2')
  })

  it('anexa relatório diário ao texto base', () => {
    const message = buildWhatsAppMessage('Prestação', true, report)

    expect(message).toContain('Prestação')
    expect(message).toContain('Relatório diário')
  })

  it('retorna apenas texto base quando relatório não é incluído', () => {
    expect(buildWhatsAppMessage('Prestação', false, report)).toBe('Prestação')
  })
})
