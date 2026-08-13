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
  listRotasSchema,
  optimizeRotaSchema,
  rotaEventosQuerySchema,
  saveRotaSchema,
  syncParadaFromEntregaSchema,
  updateEnderecoPartidaSchema,
  type ListRotasInput,
  type RotaEventosQuery,
} from '../schemas/rota.schema.js'
import { rotaService } from '../services/rota.service.js'
import { rotaExecucaoService } from '../services/rota-execucao.service.js'
import {
  bulkSyncExecucaoSchema,
  updateExecucaoParadaSchema,
} from '../schemas/rota-execucao.schema.js'

export const rotaRoutes = Router()

rotaRoutes.post(
  '/optimize',
  validateBody(optimizeRotaSchema),
  asyncHandler(async (req, res) => {
    const result = await rotaService.optimize(req.body)
    res.json(result)
  }),
)

rotaRoutes.post(
  '/planejar',
  validateBody(optimizeRotaSchema),
  asyncHandler(async (req, res) => {
    const result = await rotaService.planear(req.user!, req.body)
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
  '/eventos',
  requireRole('MOTOBOY'),
  validateQuery(rotaEventosQuerySchema),
  asyncHandler(async (req, res) => {
    const query = getValidatedQuery<RotaEventosQuery>(req)
    const eventos = await rotaService.getEventosPlanejamento(
      req.user!,
      new Date(query.since),
    )
    res.json({ eventos })
  }),
)

rotaRoutes.get(
  '/ativa-hoje',
  asyncHandler(async (req, res) => {
    const result = await rotaService.getActiveToday(req.user!)
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
  requireRole('ADMIN'),
  validateBody(updateEnderecoPartidaSchema),
  asyncHandler(async (req, res) => {
    const result = await rotaService.setEnderecoPartidaPadrao(
      req.body.enderecoPartidaPadrao,
    )
    res.json(result)
  }),
)

rotaRoutes.post(
  '/:id/reconciliar-conclusao',
  asyncHandler(async (req, res) => {
    const rotaConcluida = await rotaExecucaoService.reconcileRouteConclusion(
      getRouteParam(req, 'id'),
    )
    res.json({ rotaConcluida })
  }),
)

rotaRoutes.get(
  '/:id/execucao',
  asyncHandler(async (req, res) => {
    const result = await rotaExecucaoService.getOrInit(getRouteParam(req, 'id'))
    res.json(result)
  }),
)

rotaRoutes.patch(
  '/:id/execucao/paradas/:paradaId',
  validateBody(updateExecucaoParadaSchema),
  asyncHandler(async (req, res) => {
    const result = await rotaExecucaoService.updateParada(
      getRouteParam(req, 'id'),
      getRouteParam(req, 'paradaId'),
      req.body,
    )
    res.json(result)
  }),
)

rotaRoutes.put(
  '/:id/execucao/sync',
  validateBody(bulkSyncExecucaoSchema),
  asyncHandler(async (req, res) => {
    const result = await rotaExecucaoService.bulkSync(
      getRouteParam(req, 'id'),
      req.body,
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
    const rota = await rotaService.save(req.user!, req.body)
    res.status(201).json(rota)
  }),
)

rotaRoutes.post(
  '/:id/duplicate',
  asyncHandler(async (req, res) => {
    const rota = await rotaService.duplicate(req.user!, getRouteParam(req, 'id'))
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
    await rotaService.delete(req.user!, getRouteParam(req, 'id'))
    res.status(204).send()
  }),
)
