import type { QueryClient } from '@tanstack/react-query'

export function invalidateDeliveryRelated(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['deliveries'] })
  queryClient.invalidateQueries({ queryKey: ['planner-entregas'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
  queryClient.invalidateQueries({ queryKey: ['prestacoes'] })
  queryClient.invalidateQueries({ queryKey: ['reports'] })
}

export function invalidatePendingRelated(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['pendencias'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
  queryClient.invalidateQueries({ queryKey: ['prestacoes'] })
  queryClient.invalidateQueries({ queryKey: ['reports'] })
}

export function invalidatePrestacaoRelated(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['prestacoes'] })
  queryClient.invalidateQueries({ queryKey: ['prestacoes-cliente'] })
  queryClient.invalidateQueries({ queryKey: ['prestacoes-historico'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
  queryClient.invalidateQueries({ queryKey: ['reports'] })
}
