import { reportRepository } from '../repositories/report.repository.js'
import type {
  ReportDaysQuery,
  ReportNeighborhoodQuery,
  ReportPeriod,
  ReportSummaryQuery,
} from '../schemas/report.schema.js'

export class ReportService {
  getSummary(query: ReportSummaryQuery) {
    return reportRepository.getPeriodSummary(query.period)
  }

  getDailyTrend(query: ReportDaysQuery) {
    return reportRepository.getDailyTrend(query.days)
  }

  getByNeighborhood(query: ReportNeighborhoodQuery) {
    return reportRepository.getByNeighborhood(query.period, query.limit)
  }

  getPrestacaoTrend(query: ReportDaysQuery) {
    return reportRepository.getPrestacaoTrend(query.days)
  }

  getDashboardIndicators(period: ReportPeriod = 'week') {
    return reportRepository.getPeriodSummary(period)
  }
}

export const reportService = new ReportService()
