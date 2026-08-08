import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { invalidateDeliveryRelated } from '@/shared/lib/invalidate-related'
import { deliveryService } from '../services/delivery.service'
import type {
  DeliveryClienteFormData,
  DeliveryFilters,
  DeliveryMotoboyFormData,
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

export function useCreateMotoboyDelivery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: DeliveryMotoboyFormData) => deliveryService.createMotoboy(data),
    onSuccess: () => {
      invalidateDeliveryRelated(queryClient)
      toast('Entrega salva com sucesso!', 'success')
    },
    onError: () => toast('Erro ao salvar entrega', 'error'),
  })
}

export function useUpdateMotoboyDelivery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DeliveryMotoboyFormData }) =>
      deliveryService.updateMotoboy(id, data),
    onSuccess: () => {
      invalidateDeliveryRelated(queryClient)
      toast('Entrega atualizada com sucesso!', 'success')
    },
    onError: () => toast('Erro ao atualizar entrega', 'error'),
  })
}

export function useCreateClienteDelivery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: DeliveryClienteFormData) => deliveryService.createCliente(data),
    onSuccess: () => {
      invalidateDeliveryRelated(queryClient)
      toast('Pedido do cliente salvo!', 'success')
    },
    onError: () => toast('Erro ao salvar pedido', 'error'),
  })
}

export function useUpdateClienteDelivery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DeliveryClienteFormData }) =>
      deliveryService.updateCliente(id, data),
    onSuccess: () => {
      invalidateDeliveryRelated(queryClient)
      toast('Pedido atualizado!', 'success')
    },
    onError: () => toast('Erro ao atualizar pedido', 'error'),
  })
}

export function useImportClienteDeliveries() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ids, motoboyId }: { ids: string[]; motoboyId?: string }) =>
      deliveryService.importClienteToMotoboy(ids, motoboyId),
    onSuccess: (result) => {
      invalidateDeliveryRelated(queryClient)
      toast(`${result.total} entrega(s) importada(s) para o motoboy!`, 'success')
    },
    onError: () => toast('Erro ao importar entregas', 'error'),
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
    onError: () => toast('Erro ao excluir entrega', 'error'),
  })
}
