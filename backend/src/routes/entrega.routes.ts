import { Router } from 'express'
import {
  asyncHandler,
  getRouteParam,
  getValidatedQuery,
  validateBody,
  validateQuery,
} from '../middleware/index.js'
import { requireRole } from '../middleware/auth.middleware.js'
import {
  createEntregaSchema,
  dashboardStatsQuerySchema,
  listEntregasSchema,
  updateEntregaSchema,
  type DashboardStatsQuery,
  type ListEntregasInput,
} from '../schemas/entrega.schema.js'
import { entregaService } from '../services/entrega.service.js'

export const entregaRoutes = Router()

entregaRoutes.get(
  '/stats',
  requireRole('ADMIN'),
  validateQuery(dashboardStatsQuerySchema),
  asyncHandler(async (req, res) => {
    const { data } = getValidatedQuery<DashboardStatsQuery>(req)
    const stats = await entregaService.getDashboardStats(data)
    res.json(stats)
  }),
)

entregaRoutes.get(
  '/',
  validateQuery(listEntregasSchema),
  asyncHandler(async (req, res) => {
    const result = await entregaService.list(getValidatedQuery<ListEntregasInput>(req))
    res.json(result)
  }),
)

entregaRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const entrega = await entregaService.findById(getRouteParam(req, 'id'))
    res.json(entrega)
  }),
)

entregaRoutes.post(
  '/',
  validateBody(createEntregaSchema),
  asyncHandler(async (req, res) => {
    const entrega = await entregaService.create(req.body)
    res.status(201).json(entrega)
  }),
)

entregaRoutes.put(
  '/:id',
  validateBody(updateEntregaSchema),
  asyncHandler(async (req, res) => {
    const entrega = await entregaService.update(getRouteParam(req, 'id'), req.body)
    res.json(entrega)
  }),
)

entregaRoutes.delete(
  '/:id',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    await entregaService.delete(getRouteParam(req, 'id'))
    res.status(204).send()
  }),
)
