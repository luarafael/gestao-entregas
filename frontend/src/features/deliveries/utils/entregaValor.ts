export type EntregaValorInput = {
  valorEntrega: number | string
  pagoPeloCliente: boolean
  valorPagoCliente?: number | string | null
}

export function getValorPagoPeloCliente(entrega: EntregaValorInput): number {
  if (!entrega.pagoPeloCliente) return 0

  const valorEntrega = Number(entrega.valorEntrega)
  if (entrega.valorPagoCliente != null && entrega.valorPagoCliente !== '') {
    return Number(entrega.valorPagoCliente)
  }

  return valorEntrega
}

export function getValorRecebivelEntrega(entrega: EntregaValorInput): number {
  const valorEntrega = Number(entrega.valorEntrega)
  if (!entrega.pagoPeloCliente) return valorEntrega

  return Math.max(0, valorEntrega - getValorPagoPeloCliente(entrega))
}

export function formatPagoPeloClienteResumo(entrega: EntregaValorInput): string | null {
  if (!entrega.pagoPeloCliente) return null

  const pago = getValorPagoPeloCliente(entrega)
  const recebivel = getValorRecebivelEntrega(entrega)

  if (pago >= Number(entrega.valorEntrega)) {
    return 'Valor integral pago pelo cliente'
  }

  return `${pago.toFixed(2).replace('.', ',')} descontado — recebível ${recebivel.toFixed(2).replace('.', ',')}`
}
