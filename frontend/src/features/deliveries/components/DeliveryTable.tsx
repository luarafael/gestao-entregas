import { Button, Badge, DataTable } from '@/shared/components/ui'
import { IconPackage } from '@/shared/components/icons'
import { formatCurrency } from '@/shared/utils/cn'
import { formatTimeBR } from '@/shared/utils/format'
import { FORMA_PAGAMENTO_OPTIONS, type DeliveryViewMode } from '../schemas/delivery.schema'
import type { Entrega } from '@/shared/types/api.types'
import { useIsAdmin } from '@/features/auth/hooks/useIsAdmin'

interface DeliveryTableProps {
  viewMode: DeliveryViewMode
  deliveries: Entrega[]
  isLoading: boolean
  isFetching?: boolean
  onEdit: (delivery: Entrega) => void
  onDelete: (delivery: Entrega) => void
}

export function DeliveryTable({
  viewMode,
  deliveries,
  isLoading,
  isFetching = false,
  onEdit,
  onDelete,
}: DeliveryTableProps) {
  const canDelete = useIsAdmin()
  const isAdmin = canDelete
  const isClienteView = viewMode === 'cliente'

  const pagamentoLabel = (value: Entrega['formaPagamento']) => {
    if (!value) return '—'
    return FORMA_PAGAMENTO_OPTIONS.find((item) => item.value === value)?.label ?? value
  }

  return (
    <DataTable
      data={deliveries}
      rowKey={(delivery) => delivery.id}
      minWidthClass="min-w-190"
      isLoading={isLoading}
      isFetching={isFetching}
      emptyState={{
        icon: <IconPackage className="size-6" />,
        title: isClienteView ? 'Nenhum pedido de cliente encontrado' : 'Nenhuma entrega encontrada',
        description: isClienteView
          ? 'Cadastre um pedido na aba Cliente ou ajuste os filtros.'
          : 'Cadastre uma nova entrega ou ajuste os filtros de busca.',
      }}
      columns={[
        {
          key: 'horario',
          header: 'Horário',
          cellClassName: 'text-muted-foreground',
          render: (delivery) => formatTimeBR(delivery.horario),
        },
        ...(isAdmin && !isClienteView
          ? [
              {
                key: 'motoboy',
                header: 'Motoboy',
                cellClassName: 'text-muted-foreground',
                render: (delivery: Entrega) => delivery.motoboy?.nome ?? '—',
              },
            ]
          : []),
        {
          key: 'cliente',
          header: 'Cliente',
          cellClassName: 'font-medium',
          render: (delivery) => (
            <div className="space-y-1">
              <span>{delivery.nomeCliente ?? '—'}</span>
              {isClienteView && delivery.entregaMotoboyId ? (
                <Badge variant="success" className="text-[10px]">
                  Importado
                </Badge>
              ) : null}
            </div>
          ),
        },
        ...(isClienteView
          ? [
              {
                key: 'telefone',
                header: 'Telefone',
                cellClassName: 'text-muted-foreground',
                render: (delivery: Entrega) => delivery.telefoneCliente ?? '—',
              },
            ]
          : []),
        {
          key: 'endereco',
          header: 'Endereço',
          cellClassName: 'text-muted-foreground',
          render: (delivery) => {
            const parts = [delivery.endereco, delivery.cidade].filter(Boolean)
            return parts.join(' — ')
          },
        },
        ...(!isClienteView
          ? [
              {
                key: 'bairro',
                header: 'Bairro',
                render: (delivery: Entrega) => delivery.bairro,
              },
            ]
          : []),
        ...(isClienteView
          ? [
              {
                key: 'produto',
                header: 'Produto',
                headerClassName: 'text-right',
                cellClassName: 'text-right text-muted-foreground',
                render: (delivery: Entrega) =>
                  delivery.valorProduto
                    ? formatCurrency(Number(delivery.valorProduto))
                    : '—',
              },
              {
                key: 'taxa',
                header: 'Taxa',
                headerClassName: 'text-right',
                cellClassName: 'text-right font-medium',
                render: (delivery: Entrega) =>
                  Number(delivery.valorEntrega) > 0
                    ? formatCurrency(Number(delivery.valorEntrega))
                    : '—',
              },
              {
                key: 'pagamento',
                header: 'Pagamento',
                render: (delivery: Entrega) => pagamentoLabel(delivery.formaPagamento),
              },
            ]
          : [
              {
                key: 'valor',
                header: 'Valor',
                headerClassName: 'text-right',
                cellClassName: 'text-right font-medium',
                render: (delivery: Entrega) => (
                  <div className="flex flex-col items-end gap-1">
                    <span>{formatCurrency(Number(delivery.valorEntrega))}</span>
                    {delivery.pagoPeloCliente ? (
                      <Badge variant="warning">Pago pelo cliente</Badge>
                    ) : null}
                  </div>
                ),
              },
            ]),
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
                <Button variant="danger" size="sm" onClick={() => onDelete(delivery)}>
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
