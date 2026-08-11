import { describe, expect, it } from 'vitest'
import {
  computeMotoboyEntregaStats,
  getValorPagoPeloCliente,
  getValorRecebivelEntrega,
} from '../utils/entrega-valor.utils.js'

describe('entrega-valor utils', () => {
  it('calcula valor recebivel com desconto parcial pago pelo cliente', () => {
    expect(
      getValorRecebivelEntrega({
        valorEntrega: 30,
        pagoPeloCliente: true,
        valorPagoCliente: 10,
      }),
    ).toBe(20)

    expect(
      getValorPagoPeloCliente({
        valorEntrega: 30,
        pagoPeloCliente: true,
        valorPagoCliente: 10,
      }),
    ).toBe(10)
  })

  it('usa valor integral quando pago pelo cliente sem valor informado', () => {
    expect(
      getValorRecebivelEntrega({
        valorEntrega: 25,
        pagoPeloCliente: true,
        valorPagoCliente: null,
      }),
    ).toBe(0)
  })

  it('agrega stats de motoboy com descontos parciais', () => {
    const stats = computeMotoboyEntregaStats([
      { valorEntrega: 30, pagoPeloCliente: false, valorPagoCliente: null },
      { valorEntrega: 40, pagoPeloCliente: true, valorPagoCliente: 15 },
      { valorEntrega: 20, pagoPeloCliente: true, valorPagoCliente: 20 },
    ])

    expect(stats.totalEntregas).toBe(3)
    expect(stats.valorTotal).toBe(55)
    expect(stats.entregasPagasPeloCliente).toBe(2)
    expect(stats.valorPagasPeloCliente).toBe(35)
  })
})
