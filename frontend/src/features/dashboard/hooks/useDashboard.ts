import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/shared/services/api'
import type {
  DashboardStats,
  Entrega,
  PaginatedResponse,
} from '@/shared/types/api.types'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiFetch<DashboardStats>('/api/entregas/stats'),
  })
}

export function useTodayDeliveries() {
  return useQuery({
    queryKey: ['deliveries', 'today'],
    queryFn: () =>
      apiFetch<PaginatedResponse<Entrega>>(
        '/api/entregas?filter=today&limit=10&sortBy=horario&sortOrder=desc',
      ),
  })
}
