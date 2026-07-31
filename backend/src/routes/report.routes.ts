import { Router } from 'express'
import {
  asyncHandler,
  getValidatedQuery,
  validateQuery,
} from '../middleware/index.js'
import {
  reportDaysQuerySchema,
  reportNeighborhoodQuerySchema,
  reportSummaryQuerySchema,
  type ReportDaysQuery,
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
  '/daily-trend',
  validateQuery(reportDaysQuerySchema),
  asyncHandler(async (req, res) => {
    const trend = await reportService.getDailyTrend(
      getValidatedQuery<ReportDaysQuery>(req),
    )
    res.json(trend)
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
  validateQuery(reportDaysQuerySchema),
  asyncHandler(async (req, res) => {
    const trend = await reportService.getPrestacaoTrend(
      getValidatedQuery<ReportDaysQuery>(req),
    )
    res.json(trend)
  }),
)
