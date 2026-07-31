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

export function useDailyTrend(days = 7) {
  return useQuery({
    queryKey: ['reports', 'daily-trend', days],
    queryFn: () =>
      apiFetch<DailyTrendPoint[]>(`/api/reports/daily-trend?days=${days}`),
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

export function usePrestacaoTrend(days = 30) {
  return useQuery({
    queryKey: ['reports', 'prestacao-trend', days],
    queryFn: () =>
      apiFetch<PrestacaoTrendPoint[]>(
        `/api/reports/prestacao-trend?days=${days}`,
      ),
  })
}
