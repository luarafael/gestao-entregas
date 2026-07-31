import { describe, it, expect } from 'vitest'
import {
  generatePrestacaoSchema,
  listPrestacoesSchema,
} from '../schemas/prestacao.schema.js'

describe('prestacao schemas', () => {
  it('valida geração com data opcional', () => {
    const parsed = generatePrestacaoSchema.parse({
      observacoes: 'Fechamento do dia',
    })

    expect(parsed.observacoes).toBe('Fechamento do dia')
  })

  it('converte paginação de prestações', () => {
    const parsed = listPrestacoesSchema.parse({
      page: '2',
      limit: '5',
    })

    expect(parsed.page).toBe(2)
    expect(parsed.limit).toBe(5)
  })
})
