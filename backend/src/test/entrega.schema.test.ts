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

  it('rejeita pago pelo cliente sem nome', () => {
    expect(() =>
      createEntregaSchema.parse({
        endereco: 'Rua A, 1',
        bairro: 'Centro',
        valorEntrega: 10,
        pagoPeloCliente: true,
      }),
    ).toThrow()
  })

  it('aceita pago pelo cliente com nome', () => {
    const parsed = createEntregaSchema.parse({
      nomeCliente: 'Maria',
      endereco: 'Rua A, 1',
      bairro: 'Centro',
      valorEntrega: 10,
      pagoPeloCliente: true,
    })

    expect(parsed.pagoPeloCliente).toBe(true)
  })

  it('aceita atualização parcial', () => {
    const parsed = updateEntregaSchema.parse({
      status: 'CANCELADA',
    })

    expect(parsed.status).toBe('CANCELADA')
  })
})
