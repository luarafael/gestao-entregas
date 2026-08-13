import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/shared/services/api'
import type {
  DailyTrendPoint,
  NeighborhoodReportPoint,
  PrestacaoTrendPoint,
  ReportDayDetail,
  ReportPeriod,
  ReportSummary,
} from '@/shared/types/api.types'

export type ReportOrigemCadastro = 'MOTOBOY' | 'CLIENTE' | 'GERAL'

function buildReportUrl(
  path: string,
  params: Record<string, string | number | undefined>,
) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value))
    }
  }
  const query = search.toString()
  return query ? `${path}?${query}` : path
}

function reportScopeKey(
  motoboyId?: string,
  origemCadastro?: ReportOrigemCadastro,
) {
  return `${origemCadastro ?? 'geral'}:${motoboyId ?? 'all'}`
}

export function useReportSummary(
  period: ReportPeriod,
  motoboyId?: string,
  enabled = true,
  origemCadastro?: ReportOrigemCadastro,
) {
  const scope = reportScopeKey(motoboyId, origemCadastro)

  return useQuery({
    queryKey: ['reports', 'summary', period, scope],
    queryFn: () =>
      apiFetch<ReportSummary>(
        buildReportUrl('/api/reports/summary', {
          period,
          motoboyId,
          origemCadastro,
        }),
      ),
    enabled,
    staleTime: 5 * 60_000,
  })
}

export function usePeriodDailyBreakdown(
  period: ReportPeriod,
  motoboyId?: string,
  enabled = true,
  origemCadastro?: ReportOrigemCadastro,
) {
  const scope = reportScopeKey(motoboyId, origemCadastro)

  return useQuery({
    queryKey: ['reports', 'daily-breakdown', period, scope],
    queryFn: () =>
      apiFetch<DailyTrendPoint[]>(
        buildReportUrl('/api/reports/daily-breakdown', {
          period,
          motoboyId,
          origemCadastro,
        }),
      ),
    enabled,
    staleTime: 5 * 60_000,
  })
}

export function useNeighborhoodReport(
  period: ReportPeriod,
  limit = 5,
  motoboyId?: string,
  enabled = true,
  origemCadastro?: ReportOrigemCadastro,
) {
  const scope = reportScopeKey(motoboyId, origemCadastro)

  return useQuery({
    queryKey: ['reports', 'by-neighborhood', period, limit, scope],
    queryFn: () =>
      apiFetch<NeighborhoodReportPoint[]>(
        buildReportUrl('/api/reports/by-neighborhood', {
          period,
          limit,
          motoboyId,
          origemCadastro,
        }),
      ),
    enabled,
    staleTime: 5 * 60_000,
  })
}

export function usePrestacaoTrend(
  period: ReportPeriod,
  motoboyId?: string,
  enabled = true,
  origemCadastro?: ReportOrigemCadastro,
) {
  const scope = reportScopeKey(motoboyId, origemCadastro)

  return useQuery({
    queryKey: ['reports', 'prestacao-trend', period, scope],
    queryFn: () =>
      apiFetch<PrestacaoTrendPoint[]>(
        buildReportUrl('/api/reports/prestacao-trend', {
          period,
          motoboyId,
          origemCadastro,
        }),
      ),
    enabled,
    staleTime: 5 * 60_000,
  })
}

export function useReportDayDetail(
  date: string | null,
  motoboyId?: string,
  origemCadastro?: ReportOrigemCadastro,
) {
  const scope = reportScopeKey(motoboyId, origemCadastro)

  return useQuery({
    queryKey: ['reports', 'day-detail', date, scope],
    queryFn: () =>
      apiFetch<ReportDayDetail>(
        buildReportUrl('/api/reports/day-detail', {
          date: date ?? undefined,
          motoboyId,
          origemCadastro,
        }),
      ),
    enabled: Boolean(date),
    staleTime: 60_000,
  })
}
