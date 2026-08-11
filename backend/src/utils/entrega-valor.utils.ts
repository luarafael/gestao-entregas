export type EntregaValorRef = {
  valorEntrega: unknown
  pagoPeloCliente: boolean
  valorPagoCliente?: unknown | null
}

export function getValorPagoPeloCliente(entrega: EntregaValorRef): number {
  if (!entrega.pagoPeloCliente) return 0

  const valorEntrega = Number(entrega.valorEntrega)
  if (entrega.valorPagoCliente != null) {
    return Number(entrega.valorPagoCliente)
  }

  return valorEntrega
}

export function getValorRecebivelEntrega(entrega: EntregaValorRef): number {
  const valorEntrega = Number(entrega.valorEntrega)
  if (!entrega.pagoPeloCliente) return valorEntrega

  return Math.max(0, valorEntrega - getValorPagoPeloCliente(entrega))
}

export function computeMotoboyEntregaStats(entregas: EntregaValorRef[]) {
  let valorTotal = 0
  let entregasPagasPeloCliente = 0
  let valorPagasPeloCliente = 0

  for (const entrega of entregas) {
    valorTotal += getValorRecebivelEntrega(entrega)

    if (entrega.pagoPeloCliente) {
      entregasPagasPeloCliente += 1
      valorPagasPeloCliente += getValorPagoPeloCliente(entrega)
    }
  }

  return {
    totalEntregas: entregas.length,
    valorTotal,
    entregasPagasPeloCliente,
    valorPagasPeloCliente,
  }
}
