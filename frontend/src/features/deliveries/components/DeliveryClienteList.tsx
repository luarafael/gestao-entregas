import { EmptyState, TableSkeleton, PAGE_CARD_ARTICLE } from '@/shared/components/ui'
import { IconPackage } from '@/shared/components/icons'
import { formatTimeBR } from '@/shared/utils/format'
import { cn } from '@/shared/utils/cn'
import type { Entrega } from '@/shared/types/api.types'
import { DeliveryCardHeader } from './DeliveryCardChips'
import {
  DeliveryPagamentoCell,
  DeliveryRowActions,
  DeliveryValoresCell,
} from './DeliveryTableCells'

interface DeliveryClienteListProps {
  deliveries: Entrega[]
  isLoading: boolean
  isFetching?: boolean
  canDelete: boolean
  onEdit: (delivery: Entrega) => void
  onDelete: (delivery: Entrega) => void
}

export function DeliveryClienteList({
  deliveries,
  isLoading,
  isFetching = false,
  canDelete,
  onEdit,
  onDelete,
}: DeliveryClienteListProps) {
  if (isLoading) {
    return <TableSkeleton rows={4} />
  }

  if (deliveries.length === 0) {
    return (
      <EmptyState
        icon={<IconPackage className="size-6" />}
        title="Nenhum pedido de cliente encontrado"
        description="Cadastre um pedido na aba Cliente ou ajuste os filtros."
      />
    )
  }

  return (
    <div
      className={`space-y-3 transition-opacity ${isFetching ? 'opacity-70' : ''}`}
    >
      {deliveries.map((delivery) => {
        const endereco = [delivery.endereco, delivery.cidade].filter(Boolean).join(' — ')

        return (
          <article key={delivery.id} className={cn(PAGE_CARD_ARTICLE)}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <DeliveryCardHeader
                horario={formatTimeBR(delivery.horario)}
                nomeCliente={delivery.nomeCliente}
                telefone={delivery.telefoneCliente}
                endereco={endereco}
                imported={Boolean(delivery.entregaMotoboyId)}
              />

              <div className="w-full shrink-0 sm:w-[5.5rem]">
                <DeliveryRowActions
                  canDelete={canDelete}
                  onEdit={() => onEdit(delivery)}
                  onDelete={() => onDelete(delivery)}
                />
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <DeliveryValoresCell delivery={delivery} />
              <DeliveryPagamentoCell delivery={delivery} />
            </div>
          </article>
        )
      })}
    </div>
  )
}
