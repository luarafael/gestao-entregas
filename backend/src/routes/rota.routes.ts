import { Router } from 'express'
import {
  asyncHandler,
  getRouteParam,
  getValidatedQuery,
  validateBody,
  validateQuery,
} from '../middleware/index.js'
import {
  listRotasSchema,
  optimizeRotaSchema,
  saveRotaSchema,
  syncParadaFromEntregaSchema,
  updateEnderecoPartidaSchema,
  type ListRotasInput,
} from '../schemas/rota.schema.js'
import { rotaService } from '../services/rota.service.js'

export const rotaRoutes = Router()

rotaRoutes.post(
  '/optimize',
  validateBody(optimizeRotaSchema),
  asyncHandler(async (req, res) => {
    const result = await rotaService.optimize(req.body)
    res.json(result)
  }),
)

rotaRoutes.get(
  '/',
  validateQuery(listRotasSchema),
  asyncHandler(async (req, res) => {
    const result = await rotaService.list(
      getValidatedQuery<ListRotasInput>(req),
    )
    res.json(result)
  }),
)

rotaRoutes.get(
  '/by-entrega/:entregaId',
  asyncHandler(async (req, res) => {
    const result = await rotaService.findByEntregaId(
      getRouteParam(req, 'entregaId'),
    )
    res.json(result)
  }),
)

rotaRoutes.get(
  '/config/endereco-partida',
  asyncHandler(async (_req, res) => {
    const result = await rotaService.getEnderecoPartidaPadrao()
    res.json(result)
  }),
)

rotaRoutes.put(
  '/config/endereco-partida',
  validateBody(updateEnderecoPartidaSchema),
  asyncHandler(async (req, res) => {
    const result = await rotaService.setEnderecoPartidaPadrao(
      req.body.enderecoPartidaPadrao,
    )
    res.json(result)
  }),
)

rotaRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const rota = await rotaService.findById(getRouteParam(req, 'id'))
    res.json(rota)
  }),
)

rotaRoutes.post(
  '/',
  validateBody(saveRotaSchema),
  asyncHandler(async (req, res) => {
    const rota = await rotaService.save(req.body)
    res.status(201).json(rota)
  }),
)

rotaRoutes.post(
  '/:id/duplicate',
  asyncHandler(async (req, res) => {
    const rota = await rotaService.duplicate(getRouteParam(req, 'id'))
    res.status(201).json(rota)
  }),
)

rotaRoutes.post(
  '/sync-entrega',
  validateBody(syncParadaFromEntregaSchema),
  asyncHandler(async (req, res) => {
    const result = await rotaService.syncFromEntrega(req.body)
    res.json(result)
  }),
)

rotaRoutes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await rotaService.delete(getRouteParam(req, 'id'))
    res.status(204).send()
  }),
)
