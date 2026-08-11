import { describe, expect, it } from 'vitest'
import {
  getValorPagoPeloCliente,
  getValorRecebivelEntrega,
} from './entregaValor'

describe('entregaValor', () => {
  it('desconta valor pago pelo cliente do recebivel', () => {
    expect(
      getValorRecebivelEntrega({
        valorEntrega: 40,
        pagoPeloCliente: true,
        valorPagoCliente: 15,
      }),
    ).toBe(25)

    expect(
      getValorPagoPeloCliente({
        valorEntrega: 40,
        pagoPeloCliente: true,
        valorPagoCliente: 15,
      }),
    ).toBe(15)
  })
})
