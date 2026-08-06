import { reportRepository } from '../repositories/report.repository.js'
import type {
  ReportDailyBreakdownQuery,
  ReportNeighborhoodQuery,
  ReportPeriod,
  ReportSummaryQuery,
} from '../schemas/report.schema.js'

export class ReportService {
  getSummary(query: ReportSummaryQuery) {
    return reportRepository.getPeriodSummary(
      query.period,
      new Date(),
      query.motoboyId,
    )
  }

  getPeriodDailyBreakdown(query: ReportDailyBreakdownQuery) {
    return reportRepository.getPeriodDailyBreakdown(
      query.period,
      new Date(),
      query.motoboyId,
    )
  }

  getByNeighborhood(query: ReportNeighborhoodQuery) {
    return reportRepository.getByNeighborhood(
      query.period,
      query.limit,
      new Date(),
      query.motoboyId,
    )
  }

  getPrestacaoTrend(query: ReportSummaryQuery) {
    return reportRepository.getPrestacaoTrend(
      query.period,
      new Date(),
      query.motoboyId,
    )
  }

  getDashboardIndicators(period: ReportPeriod = 'week', motoboyId?: string) {
    return reportRepository.getPeriodSummary(period, new Date(), motoboyId)
  }
}

export const reportService = new ReportService()
