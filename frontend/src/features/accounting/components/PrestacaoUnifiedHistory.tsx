import {
  Badge,
  Button,
  EmptyState,
  Pagination,
  TableSkeleton,
} from '@/shared/components/ui'
import { IconReceipt } from '@/shared/components/icons'
import { formatCurrency } from '@/shared/utils/cn'
import { formatPrestacaoDate } from '../schemas/prestacao.schema'
import type { PrestacaoHistoricoItem } from '../types/prestacaoCliente.types'

const tipoLabels = {
  empresa: { label: 'Empresa', variant: 'default' as const },
  motoboy: { label: 'Motoboy', variant: 'default' as const },
  cliente: { label: 'Cliente', variant: 'default' as const },
}

const statusLabels = {
  ENVIADA: { label: 'Aguardando', variant: 'warning' as const },
  APROVADA: { label: 'Aprovada', variant: 'success' as const },
  REJEITADA: { label: 'Rejeitada', variant: 'danger' as const },
}

interface PrestacaoUnifiedHistoryProps {
  items: PrestacaoHistoricoItem[]
  isLoading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onCopy: (item: PrestacaoHistoricoItem) => void
  onSend?: (item: PrestacaoHistoricoItem) => void
  onExportPdf?: (item: PrestacaoHistoricoItem) => void
  onEdit?: (item: PrestacaoHistoricoItem) => void
  onDelete?: (item: PrestacaoHistoricoItem) => void
  copyingId?: string | null
  sendingId?: string | null
  deletingId?: string | null
}

export function PrestacaoUnifiedHistory({
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
}: PrestacaoUnifiedHistoryProps) {
  if (isLoading) {
    return <TableSkeleton rows={4} />
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<IconReceipt className="size-6" />}
        title="Nenhuma prestação encontrada"
        description="Gere prestações para aparecer no histórico."
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
              <th className="px-3 py-3 font-medium">Tipo</th>
              <th className="px-3 py-3 font-medium">Nome</th>
              <th className="px-3 py-3 font-medium">Entregas</th>
              <th className="px-3 py-3 font-medium text-right">Valor final</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={`${item.tipo}-${item.id}`}
                className="border-b border-border/40 transition-colors hover:bg-surface/40"
              >
                <td className="px-3 py-3 font-medium">
                  {formatPrestacaoDate(item.data)}
                </td>
                <td className="px-3 py-3">
                  <Badge variant={tipoLabels[item.tipo].variant}>
                    {tipoLabels[item.tipo].label}
                  </Badge>
                </td>
                <td className="px-3 py-3">{item.titulo}</td>
                <td className="px-3 py-3">{item.totalEntregas}</td>
                <td className="px-3 py-3 text-right font-medium">
                  {formatCurrency(item.valorFinal)}
                </td>
                <td className="px-3 py-3">
                  {item.status ? (
                    <>
                      <Badge variant={statusLabels[item.status].variant}>
                        {statusLabels[item.status].label}
                      </Badge>
                      {item.motivoRejeicao ? (
                        <p className="mt-1 text-xs text-danger">
                          {item.motivoRejeicao}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    {onEdit ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(item)}
                      >
                        Editar
                      </Button>
                    ) : null}
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
                      onClick={() => onCopy(item)}
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
                    {(item.tipo === 'empresa' ||
                      item.tipo === 'cliente' ||
                      item.tipo === 'motoboy') &&
                    onDelete ? (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDelete(item)}
                        isLoading={deletingId === item.id}
                      >
                        Excluir
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
