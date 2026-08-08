import { WA } from '@/features/accounting/utils/whatsappEmoji'
import { formatCurrency } from '@/shared/utils/cn'
import {
  FORMA_PAGAMENTO_OPTIONS,
  STATUS_PAGAMENTO_OPTIONS,
} from '@/features/deliveries/schemas/delivery.schema'
import type { Entrega } from '@/shared/types/api.types'
import type { PlannerStop } from '../schemas/routing.schema'

export type StopPaymentForma = NonNullable<Entrega['formaPagamento']>
export type StopPaymentStatus = NonNullable<Entrega['statusPagamentoCliente']>

function pagamentoLabel(value: StopPaymentForma | null | undefined) {
  if (!value) return null
  return FORMA_PAGAMENTO_OPTIONS.find((item) => item.value === value)?.label ?? value
}

export function statusPagamentoLabel(value: StopPaymentStatus | null | undefined) {
  if (!value) return null
  return STATUS_PAGAMENTO_OPTIONS.find((item) => item.value === value)?.label ?? value
}

export function formaPagamentoDisplayLabel(value: StopPaymentForma | null | undefined) {
  if (!value) return null
  return FORMA_PAGAMENTO_OPTIONS.find((item) => item.value === value)?.label ?? value
}

export function stopHasPaymentDetails(stop: PlannerStop) {
  return (
    (stop.valorProduto != null && Number(stop.valorProduto) >= 0) ||
    Boolean(stop.formaPagamento) ||
    Boolean(stop.statusPagamentoCliente)
  )
}

export function appendStopPaymentWhatsAppLines(lines: string[], stop: PlannerStop) {
  if (!stopHasPaymentDetails(stop)) return

  const parts: string[] = []

  if (stop.valorProduto != null && !Number.isNaN(Number(stop.valorProduto))) {
    parts.push(`Produto: ${formatCurrency(Number(stop.valorProduto))}`)
  }

  const forma = pagamentoLabel(stop.formaPagamento)
  if (forma) {
    parts.push(`Pagamento: ${forma}`)
  }

  const status = statusPagamentoLabel(stop.statusPagamentoCliente)
  if (status) {
    const icon = stop.statusPagamentoCliente === 'PAGO' ? WA.check : WA.unpaid
    parts.push(`${icon} ${status}`)
  }

  if (parts.length > 0) {
    lines.push(`   ${WA.money} ${parts.join(' | ')}`)
  }
}

export function mergeStopsWithLiveEntregas(
  stops: PlannerStop[],
  entregas: Entrega[],
): PlannerStop[] {
  if (entregas.length === 0) return stops

  const byId = new Map(entregas.map((entrega) => [entrega.id, entrega]))

  return stops.map((stop) => {
    if (!stop.entregaId) return stop

    const entrega = byId.get(stop.entregaId)
    if (!entrega) return stop

    return {
      ...stop,
      telefone: stop.telefone ?? entrega.telefoneCliente ?? null,
      valorProduto:
        entrega.valorProduto != null
          ? Number(entrega.valorProduto)
          : stop.valorProduto,
      formaPagamento: entrega.formaPagamento ?? stop.formaPagamento ?? null,
      statusPagamentoCliente:
        entrega.statusPagamentoCliente ?? stop.statusPagamentoCliente ?? null,
    }
  })
}
