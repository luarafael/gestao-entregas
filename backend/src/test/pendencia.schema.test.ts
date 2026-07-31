import { describe, it, expect } from 'vitest'
import {
  createPendenciaSchema,
  updatePendenciaSchema,
} from '../schemas/pendencia.schema.js'

describe('pendencia schemas', () => {
  it('valida criação de pendência', () => {
    const parsed = createPendenciaSchema.parse({
      descricao: 'Pagamento pendente',
      valor: '25',
      referenteAoDia: '2026-07-12',
    })

    expect(parsed.valor).toBe(25)
    expect(parsed.status).toBe('PENDENTE')
    expect(parsed.referenteAoDia).toBeInstanceOf(Date)
  })

  it('aceita atualização parcial', () => {
    const parsed = updatePendenciaSchema.parse({
      status: 'RECEBIDO',
    })

    expect(parsed.status).toBe('RECEBIDO')
  })
})
