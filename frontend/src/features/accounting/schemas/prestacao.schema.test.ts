import { describe, it, expect } from 'vitest'
import { toGeneratePayload } from '../schemas/prestacao.schema'

describe('toGeneratePayload', () => {
  it('converte data do formulário para ISO', () => {
    const payload = toGeneratePayload({
      data: '2026-07-31',
      observacoes: 'Observação teste',
    })

    expect(payload.observacoes).toBe('Observação teste')
    expect(payload.data).toContain('2026-07-31')
  })

  it('omite observações vazias', () => {
    const payload = toGeneratePayload({
      data: '2026-07-31',
      observacoes: '   ',
    })

    expect(payload.observacoes).toBeUndefined()
  })
})
