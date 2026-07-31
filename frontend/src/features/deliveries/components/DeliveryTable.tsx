import { Button, EmptyState, TableSkeleton } from '@/shared/components/ui'
import { IconPackage } from '@/shared/components/icons'
import { formatCurrency } from '@/shared/utils/cn'
import type { Entrega } from '@/shared/types/api.types'

interface DeliveryTableProps {
  deliveries: Entrega[]
  isLoading: boolean
  onEdit: (delivery: Entrega) => void
  onDelete: (delivery: Entrega) => void
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DeliveryTable({
  deliveries,
  isLoading,
  onEdit,
  onDelete,
}: DeliveryTableProps) {
  if (isLoading) {
    return <TableSkeleton rows={6} />
  }

  if (deliveries.length === 0) {
    return (
      <EmptyState
        icon={<IconPackage className="size-6" />}
        title="Nenhuma entrega encontrada"
        description="Cadastre uma nova entrega ou ajuste os filtros de busca."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-border/60 text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-3 font-medium">Horário</th>
            <th className="px-3 py-3 font-medium">Cliente</th>
            <th className="px-3 py-3 font-medium">Endereço</th>
            <th className="px-3 py-3 font-medium">Bairro</th>
            <th className="px-3 py-3 font-medium text-right">Valor</th>
            <th className="px-3 py-3 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map((delivery) => (
            <tr
              key={delivery.id}
              className="border-b border-border/40 transition-colors hover:bg-surface/40"
            >
              <td className="px-3 py-3 text-muted-foreground">
                {formatTime(delivery.horario)}
              </td>
              <td className="px-3 py-3 font-medium">
                {delivery.nomeCliente ?? '—'}
              </td>
              <td className="px-3 py-3 text-muted-foreground">
                {delivery.endereco}
              </td>
              <td className="px-3 py-3">{delivery.bairro}</td>
              <td className="px-3 py-3 text-right font-medium">
                {formatCurrency(Number(delivery.valorEntrega))}
              </td>
              <td className="px-3 py-3">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(delivery)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onDelete(delivery)}
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
  )
}
