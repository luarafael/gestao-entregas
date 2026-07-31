import { describe, it, expect } from 'vitest'
import { pendingFormSchema } from '../schemas/pending.schema'

describe('pendingFormSchema', () => {
  it('valida pendência com campos obrigatórios', () => {
    const result = pendingFormSchema.safeParse({
      descricao: 'Pagamento pendente do dia 12/07',
      valor: 25,
      referenteAoDia: '2026-07-12',
      status: 'PENDENTE',
    })

    expect(result.success).toBe(true)
  })

  it('rejeita pendência sem descrição', () => {
    const result = pendingFormSchema.safeParse({
      valor: 25,
      referenteAoDia: '2026-07-12',
      status: 'PENDENTE',
    })

    expect(result.success).toBe(false)
  })

  it('rejeita valor inválido', () => {
    const result = pendingFormSchema.safeParse({
      descricao: 'Teste',
      valor: 0,
      referenteAoDia: '2026-07-12',
      status: 'PENDENTE',
    })

    expect(result.success).toBe(false)
  })
})
