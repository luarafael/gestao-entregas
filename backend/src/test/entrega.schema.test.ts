import { describe, it, expect } from 'vitest'
import {
  createEntregaSchema,
  updateEntregaSchema,
  createEntregaClienteSchema,
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

  it('aceita pago pelo cliente com nome, telefone e valor', () => {
    const parsed = createEntregaSchema.parse({
      nomeCliente: 'Maria',
      telefoneCliente: '85999999999',
      endereco: 'Rua A, 1',
      bairro: 'Centro',
      valorEntrega: 10,
      valorPagoCliente: 10,
      pagoPeloCliente: true,
    })

    expect(parsed.pagoPeloCliente).toBe(true)
    expect(parsed.valorPagoCliente).toBe(10)
  })

  it('aceita atualização parcial', () => {
    const parsed = updateEntregaSchema.parse({
      status: 'CANCELADA',
    })

    expect(parsed.status).toBe('CANCELADA')
  })

  it('valida criação de entrega cliente com pagamento e valor motoboy', () => {
    const parsed = createEntregaClienteSchema.parse({
      nomeCliente: 'João',
      telefoneCliente: '11999999999',
      endereco: 'Rua A',
      valorProduto: 50,
      formaPagamento: 'PIX',
      statusPagamento: 'NAO_PAGO',
      valorEntregaMotoboy: 12,
    })

    expect(parsed.statusPagamento).toBe('NAO_PAGO')
    expect(parsed.valorEntregaMotoboy).toBe(12)
  })
})
