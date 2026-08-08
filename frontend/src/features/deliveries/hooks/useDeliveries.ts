import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { invalidateDeliveryRelated } from '@/shared/lib/invalidate-related'
import { deliveryService } from '../services/delivery.service'
import type {
  DeliveryClienteFormData,
  DeliveryFilters,
  DeliveryMotoboyFormData,
  DeliveryViewMode,
} from '../schemas/delivery.schema'
import { toast } from '@/shared/stores/toast.store'

export const DELIVERIES_QUERY_KEY = 'deliveries'

export function useDeliveries(filters: DeliveryFilters) {
  return useQuery({
    queryKey: [DELIVERIES_QUERY_KEY, filters],
    queryFn: () => deliveryService.list(filters),
    placeholderData: keepPreviousData,
  })
}

export function useDeliveryClientes(
  filters: Pick<DeliveryFilters, 'filter'>,
  enabled = true,
) {
  return useQuery({
    queryKey: [DELIVERIES_QUERY_KEY, 'clientes', filters],
    queryFn: () => deliveryService.listClientes(filters),
    enabled,
    staleTime: 10_000,
  })
}

export function useCreateDelivery(viewMode: DeliveryViewMode) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: DeliveryMotoboyFormData | DeliveryClienteFormData) =>
      deliveryService.create(viewMode, data),
    onSuccess: () => {
      invalidateDeliveryRelated(queryClient)
      toast('Entrega salva com sucesso!', 'success')
    },
    onError: () => {
      toast('Erro ao salvar entrega', 'error')
    },
  })
}

export function useUpdateDelivery(viewMode: DeliveryViewMode) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: DeliveryMotoboyFormData | DeliveryClienteFormData
    }) => deliveryService.update(viewMode, id, data),
    onSuccess: () => {
      invalidateDeliveryRelated(queryClient)
      toast('Entrega atualizada com sucesso!', 'success')
    },
    onError: () => {
      toast('Erro ao atualizar entrega', 'error')
    },
  })
}

export function useDeleteDelivery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deliveryService.delete(id),
    onSuccess: () => {
      invalidateDeliveryRelated(queryClient)
      toast('Entrega excluída com sucesso!', 'success')
    },
    onError: () => {
      toast('Erro ao excluir entrega', 'error')
    },
  })
}
