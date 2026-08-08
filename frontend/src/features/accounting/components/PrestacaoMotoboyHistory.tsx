import {
  Badge,
  Button,
  EmptyState,
  MetaChip,
  MetaField,
  PAGE_CARD_ARTICLE,
  Pagination,
  TableSkeleton,
} from '@/shared/components/ui'
import { IconReceipt, IconWhatsApp } from '@/shared/components/icons'
import { cn, formatCurrency } from '@/shared/utils/cn'
import { formatPrestacaoMotoboyDate } from '@/features/motoboy/schemas/prestacaoMotoboy.schema'
import type { PrestacaoMotoboy } from '@/features/motoboy/types/prestacaoMotoboy.types'

const statusLabels = {
  ENVIADA: { label: 'Aguardando', variant: 'warning' as const },
  APROVADA: { label: 'Aprovada', variant: 'success' as const },
  REJEITADA: { label: 'Rejeitada', variant: 'danger' as const },
}

interface PrestacaoMotoboyHistoryProps {
  items: PrestacaoMotoboy[]
  isLoading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onCopy: (id: string) => void
  onExportPdf?: (item: PrestacaoMotoboy) => void
  onSend?: (item: PrestacaoMotoboy) => void
  copyingId?: string | null
  sendingId?: string | null
}

export function PrestacaoMotoboyHistory({
  items,
  isLoading,
  page,
  totalPages,
  onPageChange,
  onCopy,
  onExportPdf,
  onSend,
  copyingId,
  sendingId,
}: PrestacaoMotoboyHistoryProps) {
  if (isLoading) {
    return <TableSkeleton rows={4} />
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<IconReceipt className="size-6" />}
        title="Nenhuma prestação enviada"
        description="Envie a prestação do dia para aparecer no histórico."
      />
    )
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className={cn(PAGE_CARD_ARTICLE)}>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <MetaField label="Data">
                <MetaChip tone="time" className="w-fit">
                  {formatPrestacaoMotoboyDate(item.data)}
                </MetaChip>
              </MetaField>
              <MetaField label="Entregas">
                <MetaChip tone="delivery" className="w-fit tabular-nums">
                  {item.totalEntregas}
                </MetaChip>
              </MetaField>
              <MetaField label="Valor entregas">
                <MetaChip tone="money" className="w-fit tabular-nums">
                  {formatCurrency(Number(item.valorTotal))}
                </MetaChip>
              </MetaField>
              <MetaField label="Repasse pend.">
                <MetaChip tone="pending" className="w-fit tabular-nums">
                  {formatCurrency(Number(item.valorPendencias))}
                </MetaChip>
              </MetaField>
              <MetaField label="Total a receber">
                <MetaChip tone="motoboyFee" className="w-fit tabular-nums">
                  {formatCurrency(Number(item.valorFinal))}
                </MetaChip>
              </MetaField>
              <MetaField label="Status">
                <div className="space-y-1">
                  <Badge variant={statusLabels[item.status].variant}>
                    {statusLabels[item.status].label}
                  </Badge>
                  {item.motivoRejeicao ? (
                    <p className="text-xs font-normal text-danger">
                      {item.motivoRejeicao}
                    </p>
                  ) : null}
                </div>
              </MetaField>
            </div>

            <div className="mt-3 flex w-full min-w-0 flex-wrap gap-2 border-t border-border/40 pt-3">
              {onExportPdf ? (
                <Button
                  variant="pdf"
                  size="sm"
                  onClick={() => onExportPdf(item)}
                >
                  PDF
                </Button>
              ) : null}
              <Button
                variant="copy"
                size="sm"
                onClick={() => onCopy(item.id)}
                isLoading={copyingId === item.id}
              >
                Copiar
              </Button>
              {onSend ? (
                <Button
                  variant="whatsapp"
                  size="sm"
                  onClick={() => onSend(item)}
                  isLoading={sendingId === item.id}
                >
                  <IconWhatsApp className="size-3.5" />
                  WhatsApp
                </Button>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  )
}
