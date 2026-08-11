import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/shared/services/api'
import { getTodayInputDate } from '@/shared/utils/date'
import type {
  DashboardStats,
  Entrega,
  PaginatedResponse,
} from '@/shared/types/api.types'
import type { DashboardOrigemCadastro } from '../types'

function buildScopedUrl(
  baseUrl: string,
  params: { motoboyId?: string; origemCadastro?: DashboardOrigemCadastro },
) {
  const search = new URLSearchParams()
  const [path, existingQuery = ''] = baseUrl.split('?')
  if (existingQuery) {
    const existing = new URLSearchParams(existingQuery)
    existing.forEach((value, key) => search.set(key, value))
  }
  if (params.motoboyId) {
    search.set('motoboyId', params.motoboyId)
  }
  if (params.origemCadastro) {
    search.set('origemCadastro', params.origemCadastro)
  }
  const query = search.toString()
  return query ? `${path}?${query}` : path
}

function reportScopeKey(
  motoboyId: string | undefined,
  origemCadastro: DashboardOrigemCadastro | undefined,
) {
  return `${origemCadastro ?? 'geral'}:${motoboyId ?? 'all'}`
}

export function useDashboardStats(
  motoboyId: string | undefined,
  origemCadastro: DashboardOrigemCadastro | undefined,
  enabled = true,
) {
  const today = getTodayInputDate()
  const scope = reportScopeKey(motoboyId, origemCadastro)

  return useQuery({
    queryKey: ['dashboard-stats', today, scope],
    queryFn: () =>
      apiFetch<DashboardStats>(
        buildScopedUrl(`/api/entregas/stats?data=${today}`, {
          motoboyId,
          origemCadastro,
        }),
      ),
    enabled,
    staleTime: 30_000,
  })
}

export function useTodayDeliveries(
  motoboyId: string | undefined,
  origemCadastro: DashboardOrigemCadastro | undefined,
  enabled = true,
) {
  const today = getTodayInputDate()
  const scope = reportScopeKey(motoboyId, origemCadastro)

  return useQuery({
    queryKey: ['deliveries', 'today', today, scope],
    queryFn: () =>
      apiFetch<PaginatedResponse<Entrega>>(
        buildScopedUrl(
          `/api/entregas?filter=today&referenceDate=${today}&limit=10&sortBy=horario&sortOrder=desc`,
          { motoboyId, origemCadastro },
        ),
      ),
    enabled,
    staleTime: 30_000,
  })
}
