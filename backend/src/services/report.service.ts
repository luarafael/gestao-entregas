import { reportRepository } from '../repositories/report.repository.js'
import type {
  ReportDailyBreakdownQuery,
  ReportNeighborhoodQuery,
  ReportPeriod,
  ReportSummaryQuery,
} from '../schemas/report.schema.js'

export class ReportService {
  getSummary(query: ReportSummaryQuery) {
    return reportRepository.getPeriodSummary(query.period)
  }

  getPeriodDailyBreakdown(query: ReportDailyBreakdownQuery) {
    return reportRepository.getPeriodDailyBreakdown(query.period)
  }

  getByNeighborhood(query: ReportNeighborhoodQuery) {
    return reportRepository.getByNeighborhood(query.period, query.limit)
  }

  getPrestacaoTrend(period: ReportPeriod) {
    return reportRepository.getPrestacaoTrend(period)
  }

  getDashboardIndicators(period: ReportPeriod = 'week') {
    return reportRepository.getPeriodSummary(period)
  }
}

export const reportService = new ReportService()
