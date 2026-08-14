import { reportRepository } from '../repositories/report.repository.js'
import { toUtcDateOnly } from '../utils/date.utils.js'
import type {
  ReportDailyBreakdownQuery,
  ReportDayDetailQuery,
  ReportNeighborhoodQuery,
  ReportPeriod,
  ReportSummaryQuery,
} from '../schemas/report.schema.js'

function resolveEntregaReportFilter(origemCadastro?: 'MOTOBOY' | 'CLIENTE' | 'GERAL') {
  if (origemCadastro === 'GERAL') {
    return {}
  }

  if (origemCadastro === 'CLIENTE') {
    return { origemCadastro: 'CLIENTE' as const }
  }

  return { origemCadastro: 'MOTOBOY' as const }
}

function useEntregaReports(origemCadastro?: 'MOTOBOY' | 'CLIENTE' | 'GERAL') {
  return origemCadastro != null
}

export class ReportService {
  getSummary(query: ReportSummaryQuery) {
    if (useEntregaReports(query.origemCadastro)) {
      return reportRepository.getEntregasPeriodSummary(
        query.period,
        new Date(),
        {
          ...resolveEntregaReportFilter(query.origemCadastro),
          motoboyId: query.motoboyId,
        },
      )
    }

    return reportRepository.getPeriodSummary(
      query.period,
      new Date(),
      query.motoboyId,
    )
  }

  getPeriodDailyBreakdown(query: ReportDailyBreakdownQuery) {
    if (useEntregaReports(query.origemCadastro)) {
      return reportRepository.getEntregasDailyBreakdown(
        query.period,
        new Date(),
        {
          ...resolveEntregaReportFilter(query.origemCadastro),
          motoboyId: query.motoboyId,
        },
      )
    }

    return reportRepository.getPeriodDailyBreakdown(
      query.period,
      new Date(),
      query.motoboyId,
    )
  }

  getByNeighborhood(query: ReportNeighborhoodQuery) {
    const filter = resolveEntregaReportFilter(query.origemCadastro)

    return reportRepository.getByNeighborhood(
      query.period,
      query.limit,
      new Date(),
      query.motoboyId,
      filter.origemCadastro,
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

  getDayDetail(query: ReportDayDetailQuery) {
    const filter = resolveEntregaReportFilter(query.origemCadastro)

    return reportRepository.getDayDetail(toUtcDateOnly(query.date), {
      ...filter,
      motoboyId: query.motoboyId,
      includeRotas: query.origemCadastro !== 'CLIENTE',
    })
  }
}

export const reportService = new ReportService()
