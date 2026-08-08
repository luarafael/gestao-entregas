import { Badge } from '@/shared/components/ui'
import { formatCurrency } from '@/shared/utils/cn'
import { STATUS_PAGAMENTO_OPTIONS } from '../schemas/delivery.schema'
import type { Entrega } from '@/shared/types/api.types'
import { FormaPagamentoBadge } from './FormaPagamentoBadge'
import {
  DeliveryCardChip,
  DeliveryCardSectionTitle,
} from './DeliveryCardChips'

type ValueChipTone = 'product' | 'delivery' | 'motoboyFee'

function statusPagamentoLabel(value: Entrega['statusPagamentoCliente']) {
  if (!value) return 'Não pago'
  return STATUS_PAGAMENTO_OPTIONS.find((item) => item.value === value)?.label ?? value
}

function ValueRow({
  tone,
  label,
  value,
  highlight = false,
}: {
  tone: ValueChipTone
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={
        highlight
          ? 'flex items-center justify-between gap-2 rounded-lg border border-primary/25 bg-primary/5 px-2.5 py-2'
          : 'flex items-center justify-between gap-2 px-0.5 py-0.5'
      }
    >
      <DeliveryCardChip tone={tone} className="shrink-0">
        {label}
      </DeliveryCardChip>
      <span
        className={
          highlight
            ? 'shrink-0 text-xs font-semibold tabular-nums text-primary'
            : 'shrink-0 text-xs font-semibold tabular-nums text-foreground'
        }
      >
        {value}
      </span>
    </div>
  )
}

export function DeliveryValoresCell({ delivery }: { delivery: Entrega }) {
  return (
    <div className="min-w-0 rounded-lg border border-border/50 bg-surface/25 p-3">
      <DeliveryCardSectionTitle tone="product">Valores</DeliveryCardSectionTitle>
      <div className="space-y-2">
        <ValueRow
          tone="product"
          label="Produto"
          value={
            delivery.valorProduto
              ? formatCurrency(Number(delivery.valorProduto))
              : '—'
          }
        />
        <ValueRow
          tone="delivery"
          label="Taxa entrega"
          value={
            Number(delivery.valorEntrega) > 0
              ? formatCurrency(Number(delivery.valorEntrega))
              : '—'
          }
        />
        <ValueRow
          tone="motoboyFee"
          label="Entrega motoboy"
          highlight
          value={
            delivery.valorEntregaMotoboy
              ? formatCurrency(Number(delivery.valorEntregaMotoboy))
              : '—'
          }
        />
      </div>
    </div>
  )
}

export function DeliveryMotoboyValoresCell({ delivery }: { delivery: Entrega }) {
  return (
    <div className="min-w-0 rounded-lg border border-border/50 bg-surface/25 p-3">
      <DeliveryCardSectionTitle tone="motoboyFee">Corrida</DeliveryCardSectionTitle>
      <div className="space-y-2">
        <ValueRow
          tone="motoboyFee"
          label="Valor da entrega"
          highlight
          value={formatCurrency(Number(delivery.valorEntrega))}
        />
        {delivery.valorProduto ? (
          <ValueRow
            tone="product"
            label="Produto"
            value={formatCurrency(Number(delivery.valorProduto))}
          />
        ) : null}
        {delivery.pagoPeloCliente ? (
          <Badge variant="warning" className="w-full justify-center gap-1.5 px-2 py-1 text-xs">
            💳 Pago pelo cliente
          </Badge>
        ) : null}
      </div>
    </div>
  )
}

export function DeliveryPagamentoCell({ delivery }: { delivery: Entrega }) {
  const isPago = delivery.statusPagamentoCliente === 'PAGO'

  return (
    <div className="min-w-0 rounded-lg border border-border/50 bg-surface/25 p-3">
      <DeliveryCardSectionTitle tone="payment">Pagamento</DeliveryCardSectionTitle>
      <div className="space-y-2">
        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border/50 bg-surface/30 px-2.5 py-2.5">
          <DeliveryCardChip tone="payment" className="text-[10px]">
            Forma
          </DeliveryCardChip>
          <FormaPagamentoBadge value={delivery.formaPagamento} className="w-full" />
        </div>
        {delivery.statusPagamentoCliente ? (
          <Badge
            variant={isPago ? 'success' : 'warning'}
            className="w-full justify-center gap-1 px-2 py-1 text-xs"
          >
            {isPago ? '✅' : '⏳'} {statusPagamentoLabel(delivery.statusPagamentoCliente)}
          </Badge>
        ) : null}
      </div>
    </div>
  )
}

export function DeliveryMotoboyPagamentoCell({ delivery }: { delivery: Entrega }) {
  if (!delivery.formaPagamento) {
    return (
      <div className="min-w-0 rounded-lg border border-border/50 bg-surface/25 p-3">
        <DeliveryCardSectionTitle tone="payment">Pagamento</DeliveryCardSectionTitle>
        <p className="text-xs text-muted-foreground">
          Forma de pagamento não informada nesta corrida.
        </p>
      </div>
    )
  }

  return <DeliveryPagamentoCell delivery={delivery} />
}

export function DeliveryRowActions({
  onEdit,
  onDelete,
  canDelete,
}: {
  onEdit: () => void
  onDelete: () => void
  canDelete: boolean
}) {
  return (
    <div className="flex w-full min-w-0 flex-col items-stretch gap-1.5">
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex h-8 w-full items-center justify-center rounded-lg border border-border/70 bg-surface/60 px-2 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
      >
        Editar
      </button>
      {canDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-8 w-full items-center justify-center rounded-lg border border-danger/25 bg-danger/10 px-2 text-xs font-medium text-danger transition-colors hover:bg-danger/15"
        >
          Excluir
        </button>
      ) : null}
    </div>
  )
}
