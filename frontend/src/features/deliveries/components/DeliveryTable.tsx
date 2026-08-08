import { type DeliveryViewMode } from '../schemas/delivery.schema'
import type { Entrega } from '@/shared/types/api.types'
import { useIsAdmin } from '@/features/auth/hooks/useIsAdmin'
import { DeliveryClienteList } from './DeliveryClienteList'
import { DeliveryMotoboyList } from './DeliveryMotoboyList'

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

  if (viewMode === 'cliente') {
    return (
      <DeliveryClienteList
        deliveries={deliveries}
        isLoading={isLoading}
        isFetching={isFetching}
        canDelete={canDelete}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )
  }

  return (
    <DeliveryMotoboyList
      deliveries={deliveries}
      isLoading={isLoading}
      isFetching={isFetching}
      canDelete={canDelete}
      showMotoboy={isAdmin}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}
