import { Router } from 'express'
import {
  asyncHandler,
  getValidatedQuery,
  validateQuery,
} from '../middleware/index.js'
import {
  reportDailyBreakdownQuerySchema,
  reportDayDetailQuerySchema,
  reportNeighborhoodQuerySchema,
  reportSummaryQuerySchema,
  type ReportDailyBreakdownQuery,
  type ReportDayDetailQuery,
  type ReportNeighborhoodQuery,
  type ReportSummaryQuery,
} from '../schemas/report.schema.js'
import { reportService } from '../services/report.service.js'
import { resolveMotoboyScope } from '../utils/auth-scope.utils.js'

export const reportRoutes = Router()

reportRoutes.get(
  '/summary',
  validateQuery(reportSummaryQuerySchema),
  asyncHandler(async (req, res) => {
    const query = getValidatedQuery<ReportSummaryQuery>(req)
    const summary = await reportService.getSummary({
      ...query,
      motoboyId: resolveMotoboyScope(req.user!, query.motoboyId),
    })
    res.json(summary)
  }),
)

reportRoutes.get(
  '/daily-breakdown',
  validateQuery(reportDailyBreakdownQuerySchema),
  asyncHandler(async (req, res) => {
    const query = getValidatedQuery<ReportDailyBreakdownQuery>(req)
    const breakdown = await reportService.getPeriodDailyBreakdown({
      ...query,
      motoboyId: resolveMotoboyScope(req.user!, query.motoboyId),
    })
    res.json(breakdown)
  }),
)

reportRoutes.get(
  '/by-neighborhood',
  validateQuery(reportNeighborhoodQuerySchema),
  asyncHandler(async (req, res) => {
    const query = getValidatedQuery<ReportNeighborhoodQuery>(req)
    const data = await reportService.getByNeighborhood({
      ...query,
      motoboyId: resolveMotoboyScope(req.user!, query.motoboyId),
    })
    res.json(data)
  }),
)

reportRoutes.get(
  '/day-detail',
  validateQuery(reportDayDetailQuerySchema),
  asyncHandler(async (req, res) => {
    const query = getValidatedQuery<ReportDayDetailQuery>(req)
    const detail = await reportService.getDayDetail({
      ...query,
      motoboyId: resolveMotoboyScope(req.user!, query.motoboyId),
    })
    res.json(detail)
  }),
)

reportRoutes.get(
  '/prestacao-trend',
  validateQuery(reportSummaryQuerySchema),
  asyncHandler(async (req, res) => {
    const query = getValidatedQuery<ReportSummaryQuery>(req)
    const trend = await reportService.getPrestacaoTrend({
      ...query,
      motoboyId: resolveMotoboyScope(req.user!, query.motoboyId),
    })
    res.json(trend)
  }),
)
