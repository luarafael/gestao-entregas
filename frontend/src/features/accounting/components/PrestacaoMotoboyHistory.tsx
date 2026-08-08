import {
  Badge,
  Button,
  EmptyState,
  Pagination,
  TableSkeleton,
} from '@/shared/components/ui'
import { IconReceipt } from '@/shared/components/icons'
import { formatCurrency } from '@/shared/utils/cn'
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
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-245 text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-3 font-medium">Data</th>
              <th className="px-3 py-3 font-medium">Entregas</th>
              <th className="px-3 py-3 font-medium text-right">Valor entregas</th>
              <th className="px-3 py-3 font-medium text-right">Repasse pend.</th>
              <th className="px-3 py-3 font-medium text-right">Total a receber</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-border/40 transition-colors hover:bg-surface/40"
              >
                <td className="px-3 py-3 font-medium">
                  {formatPrestacaoMotoboyDate(item.data)}
                </td>
                <td className="px-3 py-3">{item.totalEntregas}</td>
                <td className="px-3 py-3 text-right">
                  {formatCurrency(Number(item.valorTotal))}
                </td>
                <td className="px-3 py-3 text-right">
                  {formatCurrency(Number(item.valorPendencias))}
                </td>
                <td className="px-3 py-3 text-right font-medium">
                  {formatCurrency(Number(item.valorFinal))}
                </td>
                <td className="px-3 py-3">
                  <Badge variant={statusLabels[item.status].variant}>
                    {statusLabels[item.status].label}
                  </Badge>
                  {item.motivoRejeicao ? (
                    <p className="mt-1 text-xs text-danger">{item.motivoRejeicao}</p>
                  ) : null}
                </td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-2">
                    {onExportPdf ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onExportPdf(item)}
                      >
                        PDF
                      </Button>
                    ) : null}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onCopy(item.id)}
                      isLoading={copyingId === item.id}
                    >
                      Copiar
                    </Button>
                    {onSend ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onSend(item)}
                        isLoading={sendingId === item.id}
                      >
                        WhatsApp
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  )
}
