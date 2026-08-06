import { Button, Badge, DataTable } from '@/shared/components/ui'
import { IconPackage } from '@/shared/components/icons'
import { formatCurrency } from '@/shared/utils/cn'
import { formatTimeBR } from '@/shared/utils/format'
import type { Entrega } from '@/shared/types/api.types'
import { useIsAdmin } from '@/features/auth/hooks/useIsAdmin'

interface DeliveryTableProps {
  deliveries: Entrega[]
  isLoading: boolean
  isFetching?: boolean
  onEdit: (delivery: Entrega) => void
  onDelete: (delivery: Entrega) => void
}

export function DeliveryTable({
  deliveries,
  isLoading,
  isFetching = false,
  onEdit,
  onDelete,
}: DeliveryTableProps) {
  const canDelete = useIsAdmin()

  return (
    <DataTable
      data={deliveries}
      rowKey={(delivery) => delivery.id}
      minWidthClass="min-w-190"
      isLoading={isLoading}
      isFetching={isFetching}
      emptyState={{
        icon: <IconPackage className="size-6" />,
        title: 'Nenhuma entrega encontrada',
        description: 'Cadastre uma nova entrega ou ajuste os filtros de busca.',
      }}
      columns={[
        {
          key: 'horario',
          header: 'Horário',
          cellClassName: 'text-muted-foreground',
          render: (delivery) => formatTimeBR(delivery.horario),
        },
        {
          key: 'cliente',
          header: 'Cliente',
          cellClassName: 'font-medium',
          render: (delivery) => delivery.nomeCliente ?? '—',
        },
        {
          key: 'endereco',
          header: 'Endereço',
          cellClassName: 'text-muted-foreground',
          render: (delivery) => delivery.endereco,
        },
        {
          key: 'bairro',
          header: 'Bairro',
          render: (delivery) => delivery.bairro,
        },
        {
          key: 'valor',
          header: 'Valor',
          headerClassName: 'text-right',
          cellClassName: 'text-right font-medium',
          render: (delivery) => (
            <div className="flex flex-col items-end gap-1">
              <span>{formatCurrency(Number(delivery.valorEntrega))}</span>
              {delivery.pagoPeloCliente ? (
                <Badge variant="warning">Pago pelo cliente</Badge>
              ) : null}
            </div>
          ),
        },
        {
          key: 'acoes',
          header: 'Ações',
          headerClassName: 'text-right',
          render: (delivery) => (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => onEdit(delivery)}>
                Editar
              </Button>
              {canDelete ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onDelete(delivery)}
                >
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
