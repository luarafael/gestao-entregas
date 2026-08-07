import { Router } from 'express'
import { requireRole } from '../middleware/auth.middleware.js'
import {
  asyncHandler,
  getRouteParam,
  getValidatedQuery,
  validateBody,
  validateQuery,
} from '../middleware/index.js'
import {
  createPendenciaSchema,
  listPendenciasSchema,
  pendenciaEventosQuerySchema,
  updatePendenciaSchema,
  type ListPendenciasInput,
  type PendenciaEventosQuery,
} from '../schemas/pendencia.schema.js'
import { pendenciaService } from '../services/pendencia.service.js'

export const pendenciaRoutes = Router()

pendenciaRoutes.get(
  '/',
  validateQuery(listPendenciasSchema),
  asyncHandler(async (req, res) => {
    const result = await pendenciaService.list(
      req.user!,
      getValidatedQuery<ListPendenciasInput>(req),
    )
    res.json(result)
  }),
)

pendenciaRoutes.get(
  '/eventos',
  requireRole('ADMIN'),
  validateQuery(pendenciaEventosQuerySchema),
  asyncHandler(async (req, res) => {
    const query = getValidatedQuery<PendenciaEventosQuery>(req)
    const eventos = await pendenciaService.getEventosRepasse(new Date(query.since))
    res.json({ eventos })
  }),
)

pendenciaRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const pendencia = await pendenciaService.findById(
      req.user!,
      getRouteParam(req, 'id'),
    )
    res.json(pendencia)
  }),
)

pendenciaRoutes.post(
  '/',
  validateBody(createPendenciaSchema),
  asyncHandler(async (req, res) => {
    const pendencia = await pendenciaService.create(req.user!, req.body)
    res.status(201).json(pendencia)
  }),
)

pendenciaRoutes.put(
  '/:id',
  validateBody(updatePendenciaSchema),
  asyncHandler(async (req, res) => {
    const pendencia = await pendenciaService.update(
      req.user!,
      getRouteParam(req, 'id'),
      req.body,
    )
    res.json(pendencia)
  }),
)

pendenciaRoutes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await pendenciaService.delete(req.user!, getRouteParam(req, 'id'))
    res.status(204).send()
  }),
)
