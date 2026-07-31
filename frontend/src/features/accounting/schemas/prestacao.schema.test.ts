import { describe, it, expect } from 'vitest'
import {
  formatPrestacaoDate,
  toGeneratePayload,
} from '../schemas/prestacao.schema'

describe('toGeneratePayload', () => {
  it('converte data do formulário para ISO', () => {
    const payload = toGeneratePayload({
      data: '2026-07-31',
      observacoes: 'Observação teste',
    })

    expect(payload.observacoes).toBe('Observação teste')
    expect(payload.data).toBe('2026-07-31')
  })

  it('omite observações vazias', () => {
    const payload = toGeneratePayload({
      data: '2026-07-31',
      observacoes: '   ',
    })

    expect(payload.observacoes).toBeUndefined()
  })

  it('omite data quando não informada', () => {
    const payload = toGeneratePayload({
      observacoes: 'Sem data',
    })

    expect(payload.data).toBeUndefined()
  })

  it('formata data de prestação', () => {
    expect(formatPrestacaoDate('2026-07-31T12:00:00.000Z')).toMatch(/2026/)
  })
})
