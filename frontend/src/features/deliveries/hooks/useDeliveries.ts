import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deliveryService } from '../services/delivery.service'
import type { DeliveryFilters, DeliveryFormData } from '../schemas/delivery.schema'
import { toast } from '@/shared/stores/toast.store'

export const DELIVERIES_QUERY_KEY = 'deliveries'

export function useDeliveries(filters: DeliveryFilters) {
  return useQuery({
    queryKey: [DELIVERIES_QUERY_KEY, filters],
    queryFn: () => deliveryService.list(filters),
  })
}

export function useCreateDelivery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: DeliveryFormData) => deliveryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DELIVERIES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['deliveries', 'today'] })
      toast('Entrega salva com sucesso!', 'success')
    },
    onError: () => {
      toast('Erro ao salvar entrega', 'error')
    },
  })
}

export function useUpdateDelivery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DeliveryFormData }) =>
      deliveryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DELIVERIES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['deliveries', 'today'] })
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
      queryClient.invalidateQueries({ queryKey: [DELIVERIES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['deliveries', 'today'] })
      toast('Entrega excluída com sucesso!', 'success')
    },
    onError: () => {
      toast('Erro ao excluir entrega', 'error')
    },
  })
}
