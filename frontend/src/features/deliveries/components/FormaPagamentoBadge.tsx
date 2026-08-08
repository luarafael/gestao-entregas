import { cn } from '@/shared/utils/cn'
import type { FormaPagamentoEntrega } from '../schemas/delivery.schema'
import {
  FORMA_PAGAMENTO_STYLES,
  formaPagamentoLabel,
} from '../utils/formaPagamentoStyles'

export function FormaPagamentoBadge({
  value,
  className,
}: {
  value: FormaPagamentoEntrega | null | undefined
  className?: string
}) {
  if (!value) {
    return (
      <span className={cn('text-sm font-medium text-muted-foreground', className)}>—</span>
    )
  }

  const styles = FORMA_PAGAMENTO_STYLES[value]

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-semibold',
        styles.badge,
        className,
      )}
    >
      {formaPagamentoLabel(value)}
    </span>
  )
}
