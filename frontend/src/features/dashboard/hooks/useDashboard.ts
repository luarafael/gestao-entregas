import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/shared/services/api'
import { getTodayInputDate } from '@/shared/utils/date'
import type {
  DashboardStats,
  Entrega,
  PaginatedResponse,
} from '@/shared/types/api.types'

export function useDashboardStats() {
  const today = getTodayInputDate()

  return useQuery({
    queryKey: ['dashboard-stats', today],
    queryFn: () =>
      apiFetch<DashboardStats>(`/api/entregas/stats?data=${today}`),
    staleTime: 30_000,
  })
}

export function useTodayDeliveries() {
  const today = getTodayInputDate()

  return useQuery({
    queryKey: ['deliveries', 'today', today],
    queryFn: () =>
      apiFetch<PaginatedResponse<Entrega>>(
        `/api/entregas?filter=today&referenceDate=${today}&limit=10&sortBy=horario&sortOrder=desc`,
      ),
    staleTime: 30_000,
  })
}
