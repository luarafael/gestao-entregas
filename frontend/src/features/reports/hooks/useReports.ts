import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/shared/services/api'
import type {
  DailyTrendPoint,
  NeighborhoodReportPoint,
  PrestacaoTrendPoint,
  ReportPeriod,
  ReportSummary,
} from '@/shared/types/api.types'

export function useReportSummary(period: ReportPeriod) {
  return useQuery({
    queryKey: ['reports', 'summary', period],
    queryFn: () =>
      apiFetch<ReportSummary>(`/api/reports/summary?period=${period}`),
  })
}

export function usePeriodDailyBreakdown(period: ReportPeriod) {
  return useQuery({
    queryKey: ['reports', 'daily-breakdown', period],
    queryFn: () =>
      apiFetch<DailyTrendPoint[]>(
        `/api/reports/daily-breakdown?period=${period}`,
      ),
  })
}

export function useNeighborhoodReport(period: ReportPeriod, limit = 5) {
  return useQuery({
    queryKey: ['reports', 'by-neighborhood', period, limit],
    queryFn: () =>
      apiFetch<NeighborhoodReportPoint[]>(
        `/api/reports/by-neighborhood?period=${period}&limit=${limit}`,
      ),
  })
}

export function usePrestacaoTrend(period: ReportPeriod) {
  return useQuery({
    queryKey: ['reports', 'prestacao-trend', period],
    queryFn: () =>
      apiFetch<PrestacaoTrendPoint[]>(
        `/api/reports/prestacao-trend?period=${period}`,
      ),
  })
}
