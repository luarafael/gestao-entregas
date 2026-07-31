import { Router } from 'express'
import {
  asyncHandler,
  getRouteParam,
  validateBody,
  validateQuery,
} from '../middleware/index.js'
import {
  createEntregaSchema,
  listEntregasSchema,
  updateEntregaSchema,
  type ListEntregasInput,
} from '../schemas/entrega.schema.js'
import { entregaService } from '../services/entrega.service.js'

export const entregaRoutes = Router()

entregaRoutes.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const stats = await entregaService.getDashboardStats()
    res.json(stats)
  }),
)

entregaRoutes.get(
  '/',
  validateQuery(listEntregasSchema),
  asyncHandler(async (req, res) => {
    const result = await entregaService.list(req.query as unknown as ListEntregasInput)
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
  asyncHandler(async (req, res) => {
    await entregaService.delete(getRouteParam(req, 'id'))
    res.status(204).send()
  }),
)
