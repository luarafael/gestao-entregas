import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/shared/services/api'
import type {
  DailyTrendPoint,
  NeighborhoodReportPoint,
  PrestacaoTrendPoint,
  ReportPeriod,
  ReportSummary,
} from '@/shared/types/api.types'

function withMotoboyParam(url: string, motoboyId?: string) {
  if (!motoboyId) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}motoboyId=${encodeURIComponent(motoboyId)}`
}

export function useReportSummary(
  period: ReportPeriod,
  motoboyId?: string,
  enabled = true,
) {
  const scope = motoboyId ?? 'all'

  return useQuery({
    queryKey: ['reports', 'summary', period, scope],
    queryFn: () =>
      apiFetch<ReportSummary>(
        withMotoboyParam(`/api/reports/summary?period=${period}`, motoboyId),
      ),
    enabled,
    staleTime: 5 * 60_000,
  })
}

export function usePeriodDailyBreakdown(
  period: ReportPeriod,
  motoboyId?: string,
  enabled = true,
) {
  const scope = motoboyId ?? 'all'

  return useQuery({
    queryKey: ['reports', 'daily-breakdown', period, scope],
    queryFn: () =>
      apiFetch<DailyTrendPoint[]>(
        withMotoboyParam(
          `/api/reports/daily-breakdown?period=${period}`,
          motoboyId,
        ),
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
) {
  const scope = motoboyId ?? 'all'

  return useQuery({
    queryKey: ['reports', 'by-neighborhood', period, limit, scope],
    queryFn: () =>
      apiFetch<NeighborhoodReportPoint[]>(
        withMotoboyParam(
          `/api/reports/by-neighborhood?period=${period}&limit=${limit}`,
          motoboyId,
        ),
      ),
    enabled,
    staleTime: 5 * 60_000,
  })
}

export function usePrestacaoTrend(
  period: ReportPeriod,
  motoboyId?: string,
  enabled = true,
) {
  const scope = motoboyId ?? 'all'

  return useQuery({
    queryKey: ['reports', 'prestacao-trend', period, scope],
    queryFn: () =>
      apiFetch<PrestacaoTrendPoint[]>(
        withMotoboyParam(
          `/api/reports/prestacao-trend?period=${period}`,
          motoboyId,
        ),
      ),
    enabled,
    staleTime: 5 * 60_000,
  })
}
