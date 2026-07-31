import { describe, it, expect } from 'vitest'
import {
  createEntregaSchema,
  updateEntregaSchema,
} from '../schemas/entrega.schema.js'

describe('entrega schemas', () => {
  it('valida criação de entrega', () => {
    const parsed = createEntregaSchema.parse({
      endereco: 'Rua A, 1',
      bairro: 'Centro',
      valorEntrega: '25.5',
    })

    expect(parsed.valorEntrega).toBe(25.5)
    expect(parsed.endereco).toBe('Rua A, 1')
  })

  it('rejeita entrega sem endereço', () => {
    expect(() =>
      createEntregaSchema.parse({
        bairro: 'Centro',
        valorEntrega: 10,
      }),
    ).toThrow()
  })

  it('aceita atualização parcial', () => {
    const parsed = updateEntregaSchema.parse({
      status: 'CANCELADA',
    })

    expect(parsed.status).toBe('CANCELADA')
  })
})
