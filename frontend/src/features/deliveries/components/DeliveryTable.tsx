import { Button, Badge, DataTable } from '@/shared/components/ui'
import { IconPackage } from '@/shared/components/icons'
import { formatCurrency } from '@/shared/utils/cn'
import { formatTimeBR } from '@/shared/utils/format'
import {
  FORMA_PAGAMENTO_OPTIONS,
  STATUS_PAGAMENTO_OPTIONS,
  type DeliveryViewMode,
} from '../schemas/delivery.schema'
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

  const statusPagamentoLabel = (value: Entrega['statusPagamentoCliente']) => {
    if (!value) return 'Não pago'
    return STATUS_PAGAMENTO_OPTIONS.find((item) => item.value === value)?.label ?? value
  }

  if (isClienteView) {
    return (
      <DataTable
        data={deliveries}
        rowKey={(delivery) => delivery.id}
        compact
        scrollable={false}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyState={{
          icon: <IconPackage className="size-6" />,
          title: 'Nenhum pedido de cliente encontrado',
          description: 'Cadastre um pedido na aba Cliente ou ajuste os filtros.',
        }}
        columns={[
          {
            key: 'horario',
            header: 'Hora',
            headerClassName: 'w-[3.25rem]',
            cellClassName: 'whitespace-nowrap text-muted-foreground',
            render: (delivery) => formatTimeBR(delivery.horario),
          },
          {
            key: 'cliente',
            header: 'Cliente',
            headerClassName: 'w-[18%]',
            render: (delivery) => (
              <div className="min-w-0 space-y-0.5">
                <p className="truncate font-medium" title={delivery.nomeCliente ?? undefined}>
                  {delivery.nomeCliente ?? '—'}
                </p>
                <p
                  className="truncate text-[11px] text-muted-foreground"
                  title={delivery.telefoneCliente ?? undefined}
                >
                  {delivery.telefoneCliente ?? '—'}
                </p>
                {delivery.entregaMotoboyId ? (
                  <Badge variant="success" className="text-[9px] px-1.5 py-0">
                    Importado
                  </Badge>
                ) : null}
              </div>
            ),
          },
          {
            key: 'endereco',
            header: 'Endereço',
            headerClassName: 'w-[22%]',
            cellClassName: 'text-muted-foreground',
            render: (delivery) => {
              const local = [delivery.endereco, delivery.cidade].filter(Boolean).join(' — ')
              return (
                <p className="line-clamp-2 break-words" title={local}>
                  {local}
                </p>
              )
            },
          },
          {
            key: 'valores',
            header: 'Valores',
            headerClassName: 'w-[20%] text-right',
            cellClassName: 'text-right text-[11px] leading-relaxed text-muted-foreground',
            render: (delivery) => (
              <div className="space-y-0.5">
                <p>
                  Prod:{' '}
                  <span className="text-foreground">
                    {delivery.valorProduto
                      ? formatCurrency(Number(delivery.valorProduto))
                      : '—'}
                  </span>
                </p>
                <p>
                  Taxa:{' '}
                  <span className="text-foreground">
                    {Number(delivery.valorEntrega) > 0
                      ? formatCurrency(Number(delivery.valorEntrega))
                      : '—'}
                  </span>
                </p>
                <p>
                  Motoboy:{' '}
                  <span className="font-medium text-foreground">
                    {delivery.valorEntregaMotoboy
                      ? formatCurrency(Number(delivery.valorEntregaMotoboy))
                      : '—'}
                  </span>
                </p>
              </div>
            ),
          },
          {
            key: 'pagamento',
            header: 'Pag.',
            headerClassName: 'w-[12%]',
            render: (delivery) => (
              <div className="space-y-1">
                <p className="text-[11px]">{pagamentoLabel(delivery.formaPagamento)}</p>
                <Badge
                  variant={delivery.statusPagamentoCliente === 'PAGO' ? 'success' : 'warning'}
                  className="text-[9px] px-1.5 py-0"
                >
                  {statusPagamentoLabel(delivery.statusPagamentoCliente)}
                </Badge>
              </div>
            ),
          },
          {
            key: 'acoes',
            header: 'Ações',
            headerClassName: 'w-[4.5rem] text-right',
            render: (delivery) => (
              <div className="flex flex-col items-end gap-1">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => onEdit(delivery)}>
                  Editar
                </Button>
                {canDelete ? (
                  <Button
                    variant="danger"
                    size="sm"
                    className="h-7 px-2 text-[11px]"
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

  return (
    <DataTable
      data={deliveries}
      rowKey={(delivery) => delivery.id}
      compact
      scrollable={false}
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
          header: 'Hora',
          headerClassName: 'w-[3.25rem]',
          cellClassName: 'whitespace-nowrap text-muted-foreground',
          render: (delivery) => formatTimeBR(delivery.horario),
        },
        ...(isAdmin
          ? [
              {
                key: 'motoboy',
                header: 'Motoboy',
                headerClassName: 'w-[14%]',
                cellClassName: 'truncate text-muted-foreground',
                render: (delivery: Entrega) => delivery.motoboy?.nome ?? '—',
              },
            ]
          : []),
        {
          key: 'cliente',
          header: 'Cliente',
          headerClassName: 'w-[14%]',
          cellClassName: 'truncate font-medium',
          render: (delivery) => delivery.nomeCliente ?? '—',
        },
        {
          key: 'endereco',
          header: 'Endereço',
          cellClassName: 'truncate text-muted-foreground',
          render: (delivery) => delivery.endereco,
        },
        {
          key: 'bairro',
          header: 'Bairro',
          headerClassName: 'w-[12%]',
          cellClassName: 'truncate',
          render: (delivery) => delivery.bairro,
        },
        {
          key: 'valor',
          header: 'Valor',
          headerClassName: 'w-[5.5rem] text-right',
          cellClassName: 'text-right font-medium',
          render: (delivery) => (
            <div className="flex flex-col items-end gap-0.5">
              <span>{formatCurrency(Number(delivery.valorEntrega))}</span>
              {delivery.pagoPeloCliente ? (
                <Badge variant="warning" className="text-[9px] px-1.5 py-0">
                  Pago cliente
                </Badge>
              ) : null}
            </div>
          ),
        },
        {
          key: 'acoes',
          header: 'Ações',
          headerClassName: 'w-[4.5rem] text-right',
          render: (delivery) => (
            <div className="flex flex-col items-end gap-1">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => onEdit(delivery)}>
                Editar
              </Button>
              {canDelete ? (
                <Button
                  variant="danger"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
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
