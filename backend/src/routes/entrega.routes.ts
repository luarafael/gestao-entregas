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
  monitoramentoQuerySchema,
  monitoramentoEventosQuerySchema,
  updateEntregaSchema,
  createEntregaClienteSchema,
  updateEntregaClienteSchema,
  importEntregasClienteSchema,
  entregasPorIdsSchema,
  updateStatusPagamentoSchema,
  type DashboardStatsQuery,
  type ListEntregasInput,
  type MonitoramentoQuery,
  type MonitoramentoEventosQuery,
  type EntregasPorIdsInput,
  type UpdateStatusPagamentoInput,
} from '../schemas/entrega.schema.js'
import { entregaService } from '../services/entrega.service.js'
import { resolveMotoboyScope } from '../utils/auth-scope.utils.js'

export const entregaRoutes = Router()

entregaRoutes.get(
  '/stats',
  requireRole('ADMIN', 'MOTOBOY'),
  validateQuery(dashboardStatsQuerySchema),
  asyncHandler(async (req, res) => {
    const query = getValidatedQuery<DashboardStatsQuery>(req)
    const stats = await entregaService.getDashboardStats(
      query.data,
      resolveMotoboyScope(req.user!, query.motoboyId),
    )
    res.json(stats)
  }),
)

entregaRoutes.get(
  '/monitoramento/eventos',
  requireRole('ADMIN'),
  validateQuery(monitoramentoEventosQuerySchema),
  asyncHandler(async (req, res) => {
    const query = getValidatedQuery<MonitoramentoEventosQuery>(req)
    const eventos = await entregaService.getMonitoramentoEventos(
      new Date(query.since),
      query.motoboyId,
    )
    res.json({ eventos })
  }),
)

entregaRoutes.get(
  '/monitoramento',
  requireRole('ADMIN'),
  validateQuery(monitoramentoQuerySchema),
  asyncHandler(async (req, res) => {
    const query = getValidatedQuery<MonitoramentoQuery>(req)
    const monitoramento = await entregaService.getMonitoramento(
      query.data,
      query.motoboyId,
    )
    res.json(monitoramento)
  }),
)

entregaRoutes.get(
  '/meu-resumo',
  requireRole('MOTOBOY'),
  validateQuery(dashboardStatsQuerySchema),
  asyncHandler(async (req, res) => {
    const { data } = getValidatedQuery<DashboardStatsQuery>(req)
    const resumo = await entregaService.getMotoboyResumo(req.user!, data)
    res.json(resumo)
  }),
)

entregaRoutes.get(
  '/clientes',
  validateQuery(listEntregasSchema),
  asyncHandler(async (req, res) => {
    const result = await entregaService.listClientes(
      req.user!,
      getValidatedQuery<ListEntregasInput>(req),
    )
    res.json(result)
  }),
)

entregaRoutes.post(
  '/cliente/importar-motoboy',
  validateBody(importEntregasClienteSchema),
  asyncHandler(async (req, res) => {
    const result = await entregaService.importClienteToMotoboy(req.user!, req.body)
    res.json(result)
  }),
)

entregaRoutes.post(
  '/cliente',
  validateBody(createEntregaClienteSchema),
  asyncHandler(async (req, res) => {
    const entrega = await entregaService.createCliente(req.user!, req.body)
    res.status(201).json(entrega)
  }),
)

entregaRoutes.put(
  '/cliente/:id',
  validateBody(updateEntregaClienteSchema),
  asyncHandler(async (req, res) => {
    const entrega = await entregaService.updateCliente(
      req.user!,
      getRouteParam(req, 'id'),
      req.body,
    )
    res.json(entrega)
  }),
)

entregaRoutes.post(
  '/por-ids',
  validateBody(entregasPorIdsSchema),
  asyncHandler(async (req, res) => {
    const { ids } = req.body as EntregasPorIdsInput
    const data = await entregaService.findByIds(req.user!, ids)
    res.json({ data })
  }),
)

entregaRoutes.get(
  '/',
  validateQuery(listEntregasSchema),
  asyncHandler(async (req, res) => {
    const result = await entregaService.list(
      req.user!,
      getValidatedQuery<ListEntregasInput>(req),
    )
    res.json(result)
  }),
)

entregaRoutes.patch(
  '/:id/status-pagamento',
  validateBody(updateStatusPagamentoSchema),
  asyncHandler(async (req, res) => {
    const { statusPagamento } = req.body as UpdateStatusPagamentoInput
    const entrega = await entregaService.updateStatusPagamento(
      req.user!,
      getRouteParam(req, 'id'),
      statusPagamento,
    )
    res.json(entrega)
  }),
)

entregaRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const entrega = await entregaService.findById(
      req.user!,
      getRouteParam(req, 'id'),
    )
    res.json(entrega)
  }),
)

entregaRoutes.post(
  '/',
  validateBody(createEntregaSchema),
  asyncHandler(async (req, res) => {
    const entrega = await entregaService.create(req.user!, req.body)
    res.status(201).json(entrega)
  }),
)

entregaRoutes.put(
  '/:id',
  validateBody(updateEntregaSchema),
  asyncHandler(async (req, res) => {
    const entrega = await entregaService.update(
      req.user!,
      getRouteParam(req, 'id'),
      req.body,
    )
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
