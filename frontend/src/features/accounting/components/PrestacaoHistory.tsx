import {
  Button,
  EmptyState,
  Pagination,
  TableSkeleton,
} from '@/shared/components/ui'
import { IconReceipt } from '@/shared/components/icons'
import { formatCurrency } from '@/shared/utils/cn'
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
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-245 text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-3 font-medium">Data</th>
              <th className="px-3 py-3 font-medium">Entregas</th>
              <th className="px-3 py-3 font-medium text-right">Total</th>
              <th className="px-3 py-3 font-medium text-right">Pendências</th>
              <th className="px-3 py-3 font-medium text-right">Valor final</th>
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
                  {formatPrestacaoDate(item.data)}
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
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(item)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onCopy(item.id)}
                      isLoading={copyingId === item.id}
                    >
                      Copiar
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onSend(item)}
                      isLoading={sendingId === item.id}
                    >
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
