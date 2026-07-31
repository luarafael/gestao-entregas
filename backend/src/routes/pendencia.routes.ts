import { Router } from 'express'
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
  updatePendenciaSchema,
  type ListPendenciasInput,
} from '../schemas/pendencia.schema.js'
import { pendenciaService } from '../services/pendencia.service.js'

export const pendenciaRoutes = Router()

pendenciaRoutes.get(
  '/',
  validateQuery(listPendenciasSchema),
  asyncHandler(async (req, res) => {
    const result = await pendenciaService.list(getValidatedQuery<ListPendenciasInput>(req))
    res.json(result)
  }),
)

pendenciaRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const pendencia = await pendenciaService.findById(getRouteParam(req, 'id'))
    res.json(pendencia)
  }),
)

pendenciaRoutes.post(
  '/',
  validateBody(createPendenciaSchema),
  asyncHandler(async (req, res) => {
    const pendencia = await pendenciaService.create(req.body)
    res.status(201).json(pendencia)
  }),
)

pendenciaRoutes.put(
  '/:id',
  validateBody(updatePendenciaSchema),
  asyncHandler(async (req, res) => {
    const pendencia = await pendenciaService.update(getRouteParam(req, 'id'), req.body)
    res.json(pendencia)
  }),
)

pendenciaRoutes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await pendenciaService.delete(getRouteParam(req, 'id'))
    res.status(204).send()
  }),
)
