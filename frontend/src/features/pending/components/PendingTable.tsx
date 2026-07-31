import { Badge, Button, EmptyState, TableSkeleton } from '@/shared/components/ui'
import { IconClock } from '@/shared/components/icons'
import { formatCurrency } from '@/shared/utils/cn'
import { formatReferenteAoDia } from '../schemas/pending.schema'
import type { Pendencia } from '@/shared/types/api.types'

interface PendingTableProps {
  items: Pendencia[]
  isLoading: boolean
  onEdit: (item: Pendencia) => void
  onDelete: (item: Pendencia) => void
}

export function PendingTable({
  items,
  isLoading,
  onEdit,
  onDelete,
}: PendingTableProps) {
  if (isLoading) {
    return <TableSkeleton rows={6} />
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<IconClock className="size-6" />}
        title="Nenhuma pendência encontrada"
        description="Cadastre uma nova pendência ou ajuste os filtros."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead>
          <tr className="border-b border-border/60 text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-3 font-medium">Descrição</th>
            <th className="px-3 py-3 font-medium">Referente ao dia</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3 font-medium text-right">Valor</th>
            <th className="px-3 py-3 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-b border-border/40 transition-colors hover:bg-surface/40"
            >
              <td className="px-3 py-3 font-medium">{item.descricao}</td>
              <td className="px-3 py-3 text-muted-foreground">
                {formatReferenteAoDia(item.referenteAoDia)}
              </td>
              <td className="px-3 py-3">
                <Badge variant={item.status === 'RECEBIDO' ? 'success' : 'warning'}>
                  {item.status === 'RECEBIDO' ? 'Recebido' : 'Pendente'}
                </Badge>
              </td>
              <td className="px-3 py-3 text-right font-medium">
                {formatCurrency(Number(item.valor))}
              </td>
              <td className="px-3 py-3">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                    Editar
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => onDelete(item)}>
                    Excluir
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
