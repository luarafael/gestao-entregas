import { Badge, Button, DataTable } from '@/shared/components/ui'
import { IconClock } from '@/shared/components/icons'
import { formatCurrency } from '@/shared/utils/cn'
import { useIsAdmin } from '@/features/auth/hooks/useIsAdmin'
import { formatReferenteAoDia } from '../schemas/pending.schema'
import type { Pendencia } from '@/shared/types/api.types'

interface PendingTableProps {
  items: Pendencia[]
  isLoading: boolean
  isFetching?: boolean
  onEdit: (item: Pendencia) => void
  onDelete: (item: Pendencia) => void
}

export function PendingTable({
  items,
  isLoading,
  isFetching = false,
  onEdit,
  onDelete,
}: PendingTableProps) {
  const isAdmin = useIsAdmin()

  return (
    <DataTable
      data={items}
      rowKey={(item) => item.id}
      minWidthClass="min-w-170"
      isLoading={isLoading}
      isFetching={isFetching}
      emptyState={{
        icon: <IconClock className="size-6" />,
        title: 'Nenhuma pendência encontrada',
        description: 'Cadastre uma nova pendência ou ajuste os filtros.',
      }}
      columns={[
        {
          key: 'descricao',
          header: 'Descrição',
          cellClassName: 'font-medium',
          render: (item) => item.descricao,
        },
        {
          key: 'referente',
          header: 'Referente ao dia',
          cellClassName: 'text-muted-foreground',
          render: (item) => formatReferenteAoDia(item.referenteAoDia),
        },
        {
          key: 'status',
          header: 'Status',
          render: (item) => (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={item.status === 'RECEBIDO' ? 'success' : 'warning'}>
                {item.status === 'RECEBIDO' ? 'Recebido' : 'Pendente'}
              </Badge>
              {isAdmin && item.tipo === 'REPASSE_MOTOBOY' ? (
                <Badge variant="default">Repasse motoboy</Badge>
              ) : null}
            </div>
          ),
        },
        {
          key: 'valor',
          header: 'Valor',
          headerClassName: 'text-right',
          cellClassName: 'text-right font-medium',
          render: (item) => formatCurrency(Number(item.valor)),
        },
        {
          key: 'acoes',
          header: 'Ações',
          headerClassName: 'text-right',
          render: (item) => (
            <div className="flex justify-end gap-2">
              {item.status === 'PENDENTE' || isAdmin ? (
                <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                  Editar
                </Button>
              ) : null}
              {item.status === 'PENDENTE' || isAdmin ? (
                <Button variant="danger" size="sm" onClick={() => onDelete(item)}>
                  Excluir
                </Button>
              ) : null}
            </div>
          ),
        },
      ]}
    />
  )
}
