import { Router } from 'express'
import {
  asyncHandler,
  getValidatedQuery,
  validateQuery,
} from '../middleware/index.js'
import {
  reportDailyBreakdownQuerySchema,
  reportNeighborhoodQuerySchema,
  reportSummaryQuerySchema,
  type ReportDailyBreakdownQuery,
  type ReportNeighborhoodQuery,
  type ReportSummaryQuery,
} from '../schemas/report.schema.js'
import { reportService } from '../services/report.service.js'

export const reportRoutes = Router()

reportRoutes.get(
  '/summary',
  validateQuery(reportSummaryQuerySchema),
  asyncHandler(async (req, res) => {
    const summary = await reportService.getSummary(
      getValidatedQuery<ReportSummaryQuery>(req),
    )
    res.json(summary)
  }),
)

reportRoutes.get(
  '/daily-breakdown',
  validateQuery(reportDailyBreakdownQuerySchema),
  asyncHandler(async (req, res) => {
    const breakdown = await reportService.getPeriodDailyBreakdown(
      getValidatedQuery<ReportDailyBreakdownQuery>(req),
    )
    res.json(breakdown)
  }),
)

reportRoutes.get(
  '/by-neighborhood',
  validateQuery(reportNeighborhoodQuerySchema),
  asyncHandler(async (req, res) => {
    const data = await reportService.getByNeighborhood(
      getValidatedQuery<ReportNeighborhoodQuery>(req),
    )
    res.json(data)
  }),
)

reportRoutes.get(
  '/prestacao-trend',
  validateQuery(reportSummaryQuerySchema),
  asyncHandler(async (req, res) => {
    const trend = await reportService.getPrestacaoTrend(
      getValidatedQuery<ReportSummaryQuery>(req).period,
    )
    res.json(trend)
  }),
)
