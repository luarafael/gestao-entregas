import type { FormaPagamentoEntrega } from '../schemas/delivery.schema'
import { FORMA_PAGAMENTO_OPTIONS } from '../schemas/delivery.schema'

export const FORMA_PAGAMENTO_STYLES: Record<
  FormaPagamentoEntrega,
  { badge: string; ring: string }
> = {
  DINHEIRO: {
    badge: 'border-emerald-500/35 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
    ring: 'ring-emerald-500/20',
  },
  PIX: {
    badge: 'border-teal-500/35 bg-teal-500/12 text-teal-700 dark:text-teal-300',
    ring: 'ring-teal-500/20',
  },
  CARTAO: {
    badge: 'border-indigo-500/35 bg-indigo-500/12 text-indigo-700 dark:text-indigo-300',
    ring: 'ring-indigo-500/20',
  },
}

export function formaPagamentoLabel(value: FormaPagamentoEntrega | null | undefined) {
  if (!value) return '—'
  return FORMA_PAGAMENTO_OPTIONS.find((item) => item.value === value)?.label ?? value
}
