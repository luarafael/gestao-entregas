import {
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
import { formatPrestacaoDate } from '../schemas/prestacao.schema'
import type { PrestacaoContas } from '../types'

interface PrestacaoHistoryProps {
  items: PrestacaoContas[]
  isLoading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onCopy: (id: string) => void
  onSend: (item: PrestacaoContas) => void
  onExportPdf: (item: PrestacaoContas) => void
  onEdit: (item: PrestacaoContas) => void
  onDelete: (item: PrestacaoContas) => void
  copyingId?: string | null
  sendingId?: string | null
  deletingId?: string | null
}

export function PrestacaoHistory({
  items,
  isLoading,
  page,
  totalPages,
  onPageChange,
  onCopy,
  onSend,
  onExportPdf,
  onEdit,
  onDelete,
  copyingId,
  sendingId,
  deletingId,
}: PrestacaoHistoryProps) {
  if (isLoading) {
    return <TableSkeleton rows={4} />
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<IconReceipt className="size-6" />}
        title="Nenhuma prestação gerada"
        description="Gere a prestação do dia para salvar o histórico."
      />
    )
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className={cn(PAGE_CARD_ARTICLE)}>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <MetaField label="Data">
                <MetaChip tone="time" className="w-fit">
                  {formatPrestacaoDate(item.data)}
                </MetaChip>
              </MetaField>
              <MetaField label="Entregas">
                <MetaChip tone="delivery" className="w-fit tabular-nums">
                  {item.totalEntregas}
                </MetaChip>
              </MetaField>
              <MetaField label="Total">
                <MetaChip tone="money" className="w-fit tabular-nums">
                  {formatCurrency(Number(item.valorTotal))}
                </MetaChip>
              </MetaField>
              <MetaField label="Pendências">
                <MetaChip tone="pending" className="w-fit tabular-nums">
                  {formatCurrency(Number(item.valorPendencias))}
                </MetaChip>
              </MetaField>
              <MetaField label="Valor final">
                <MetaChip tone="money" className="w-fit tabular-nums">
                  {formatCurrency(Number(item.valorFinal))}
                </MetaChip>
              </MetaField>
            </div>

            <div className="mt-3 flex w-full min-w-0 flex-wrap gap-2 border-t border-border/40 pt-3">
              <Button variant="edit" size="sm" onClick={() => onEdit(item)}>
                Editar
              </Button>
              <Button
                variant="pdf"
                size="sm"
                onClick={() => onExportPdf(item)}
              >
                PDF
              </Button>
              <Button
                variant="copy"
                size="sm"
                onClick={() => onCopy(item.id)}
                isLoading={copyingId === item.id}
              >
                Copiar
              </Button>
              <Button
                variant="whatsapp"
                size="sm"
                onClick={() => onSend(item)}
                isLoading={sendingId === item.id}
              >
                <IconWhatsApp className="size-3.5" />
                WhatsApp
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(item)}
                isLoading={deletingId === item.id}
              >
                Excluir
              </Button>
            </div>
          </article>
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  )
}
