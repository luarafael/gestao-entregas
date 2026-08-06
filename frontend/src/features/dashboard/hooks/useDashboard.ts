import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/shared/services/api'
import { getTodayInputDate } from '@/shared/utils/date'
import type {
  DashboardStats,
  Entrega,
  PaginatedResponse,
} from '@/shared/types/api.types'

function withMotoboyParam(url: string, motoboyId?: string) {
  if (!motoboyId) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}motoboyId=${encodeURIComponent(motoboyId)}`
}

export function useDashboardStats(motoboyId?: string) {
  const today = getTodayInputDate()
  const scope = motoboyId ?? 'all'

  return useQuery({
    queryKey: ['dashboard-stats', today, scope],
    queryFn: () =>
      apiFetch<DashboardStats>(
        withMotoboyParam(`/api/entregas/stats?data=${today}`, motoboyId),
      ),
    staleTime: 30_000,
  })
}

export function useTodayDeliveries(motoboyId?: string) {
  const today = getTodayInputDate()
  const scope = motoboyId ?? 'all'

  return useQuery({
    queryKey: ['deliveries', 'today', today, scope],
    queryFn: () =>
      apiFetch<PaginatedResponse<Entrega>>(
        withMotoboyParam(
          `/api/entregas?filter=today&referenceDate=${today}&limit=10&sortBy=horario&sortOrder=desc`,
          motoboyId,
        ),
      ),
    staleTime: 30_000,
  })
}
