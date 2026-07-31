import { describe, it, expect } from 'vitest'
import {
  formatReferenteAoDia,
  toApiPayload,
  toInputDate,
} from './pending.schema'

describe('pending schema helpers', () => {
  it('converte formulário para payload da API', () => {
    const payload = toApiPayload({
      descricao: 'Teste',
      valor: 25,
      referenteAoDia: '2026-07-12',
      status: 'PENDENTE',
    })

    expect(payload.referenteAoDia).toBe('2026-07-12')
  })

  it('formata data de referência', () => {
    expect(formatReferenteAoDia('2026-07-12T00:00:00.000Z')).toMatch(/2026/)
  })

  it('converte data para input date', () => {
    expect(toInputDate('2026-07-12T00:00:00.000Z')).toMatch(/2026-07-/)
  })
})
