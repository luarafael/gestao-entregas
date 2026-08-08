import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deliveryService } from '@/features/deliveries/services/delivery.service'
import { invalidateDeliveryRelated } from '@/shared/lib/invalidate-related'

export const PLANNER_ENTREGAS_QUERY_KEY = 'planner-entregas'

const REFETCH_MS = 5_000

export function usePlannerEntregas(entregaIds: string[], enabled = true) {
  const sortedIds = useMemo(
    () => [...new Set(entregaIds.filter(Boolean))].sort(),
    [entregaIds],
  )

  return useQuery({
    queryKey: [PLANNER_ENTREGAS_QUERY_KEY, sortedIds],
    queryFn: () => deliveryService.listByIds(sortedIds),
    enabled: enabled && sortedIds.length > 0,
    refetchInterval: REFETCH_MS,
    staleTime: 0,
  })
}

export function useUpdateEntregaPaymentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string
      status: 'PAGO' | 'NAO_PAGO'
    }) => deliveryService.updatePaymentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLANNER_ENTREGAS_QUERY_KEY] })
      invalidateDeliveryRelated(queryClient)
    },
  })
}
