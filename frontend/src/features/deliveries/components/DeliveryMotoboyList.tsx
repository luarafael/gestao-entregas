import { EmptyState, TableSkeleton } from '@/shared/components/ui'
import { IconPackage } from '@/shared/components/icons'
import { formatTimeBR } from '@/shared/utils/format'
import type { Entrega } from '@/shared/types/api.types'
import { DeliveryCardHeader } from './DeliveryCardChips'
import {
  DeliveryMotoboyPagamentoCell,
  DeliveryMotoboyValoresCell,
  DeliveryRowActions,
} from './DeliveryTableCells'

interface DeliveryMotoboyListProps {
  deliveries: Entrega[]
  isLoading: boolean
  isFetching?: boolean
  canDelete: boolean
  showMotoboy: boolean
  onEdit: (delivery: Entrega) => void
  onDelete: (delivery: Entrega) => void
}

export function DeliveryMotoboyList({
  deliveries,
  isLoading,
  isFetching = false,
  canDelete,
  showMotoboy,
  onEdit,
  onDelete,
}: DeliveryMotoboyListProps) {
  if (isLoading) {
    return <TableSkeleton rows={4} />
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
    <div
      className={`space-y-3 transition-opacity ${isFetching ? 'opacity-70' : ''}`}
    >
      {deliveries.map((delivery) => {
        const endereco = [delivery.endereco, delivery.bairro, delivery.cidade]
          .filter(Boolean)
          .join(' — ')

        return (
          <article
            key={delivery.id}
            className="rounded-xl border border-border/60 bg-surface/20 p-3 sm:p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <DeliveryCardHeader
                horario={formatTimeBR(delivery.horario)}
                nomeCliente={delivery.nomeCliente}
                endereco={endereco}
                motoboyNome={showMotoboy ? delivery.motoboy?.nome : null}
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
              <DeliveryMotoboyValoresCell delivery={delivery} />
              <DeliveryMotoboyPagamentoCell delivery={delivery} />
            </div>
          </article>
        )
      })}
    </div>
  )
}
