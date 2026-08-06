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

export function useReportSummary(period: ReportPeriod, motoboyId?: string) {
  const scope = motoboyId ?? 'all'

  return useQuery({
    queryKey: ['reports', 'summary', period, scope],
    queryFn: () =>
      apiFetch<ReportSummary>(
        withMotoboyParam(`/api/reports/summary?period=${period}`, motoboyId),
      ),
    staleTime: 5 * 60_000,
  })
}

export function usePeriodDailyBreakdown(
  period: ReportPeriod,
  motoboyId?: string,
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
    staleTime: 5 * 60_000,
  })
}

export function useNeighborhoodReport(
  period: ReportPeriod,
  limit = 5,
  motoboyId?: string,
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
    staleTime: 5 * 60_000,
  })
}

export function usePrestacaoTrend(period: ReportPeriod) {
  return useQuery({
    queryKey: ['reports', 'prestacao-trend', period],
    queryFn: () =>
      apiFetch<PrestacaoTrendPoint[]>(
        `/api/reports/prestacao-trend?period=${period}`,
      ),
    staleTime: 5 * 60_000,
  })
}
