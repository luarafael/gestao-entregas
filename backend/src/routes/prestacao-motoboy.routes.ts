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
  listPendentesQuerySchema,
  listPrestacoesMotoboySchema,
  previewPrestacaoMotoboyQuerySchema,
  rejectPrestacaoMotoboySchema,
  submitPrestacaoMotoboySchema,
  type ListPendentesQuery,
  type ListPrestacoesMotoboyInput,
  type PreviewPrestacaoMotoboyQuery,
} from '../schemas/prestacao-motoboy.schema.js'
import { prestacaoMotoboyService } from '../services/prestacao-motoboy.service.js'

export const prestacaoMotoboyRoutes = Router()

prestacaoMotoboyRoutes.get(
  '/pendentes',
  requireRole('ADMIN'),
  validateQuery(listPendentesQuerySchema),
  asyncHandler(async (req, res) => {
    const query = getValidatedQuery<ListPendentesQuery>(req)
    const result = await prestacaoMotoboyService.listPending(
      req.user!,
      query.motoboyId,
    )
    res.json(result)
  }),
)

prestacaoMotoboyRoutes.get(
  '/pendentes/count',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const result = await prestacaoMotoboyService.countPending(req.user!)
    res.json(result)
  }),
)

prestacaoMotoboyRoutes.get(
  '/preview',
  requireRole('ADMIN', 'MOTOBOY'),
  validateQuery(previewPrestacaoMotoboyQuerySchema),
  asyncHandler(async (req, res) => {
    const query = getValidatedQuery<PreviewPrestacaoMotoboyQuery>(req)
    const preview = await prestacaoMotoboyService.preview(req.user!, {
      data: query.data,
      motoboyId: query.motoboyId,
    })
    res.json(preview)
  }),
)

prestacaoMotoboyRoutes.get(
  '/',
  validateQuery(listPrestacoesMotoboySchema),
  asyncHandler(async (req, res) => {
    const result = await prestacaoMotoboyService.list(
      req.user!,
      getValidatedQuery<ListPrestacoesMotoboyInput>(req),
    )
    res.json(result)
  }),
)

prestacaoMotoboyRoutes.post(
  '/',
  requireRole('ADMIN', 'MOTOBOY'),
  validateBody(submitPrestacaoMotoboySchema),
  asyncHandler(async (req, res) => {
    const result = await prestacaoMotoboyService.submit(req.user!, req.body)
    res.status(201).json(result)
  }),
)

prestacaoMotoboyRoutes.get(
  '/:id/whatsapp',
  asyncHandler(async (req, res) => {
    const text = await prestacaoMotoboyService.getWhatsAppText(
      req.user!,
      getRouteParam(req, 'id'),
    )
    res.json(text)
  }),
)

prestacaoMotoboyRoutes.post(
  '/:id/aprovar',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const prestacao = await prestacaoMotoboyService.approve(
      req.user!,
      getRouteParam(req, 'id'),
    )
    res.json(prestacao)
  }),
)

prestacaoMotoboyRoutes.post(
  '/:id/rejeitar',
  requireRole('ADMIN'),
  validateBody(rejectPrestacaoMotoboySchema),
  asyncHandler(async (req, res) => {
    const prestacao = await prestacaoMotoboyService.reject(
      req.user!,
      getRouteParam(req, 'id'),
      req.body,
    )
    res.json(prestacao)
  }),
)

prestacaoMotoboyRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const prestacao = await prestacaoMotoboyService.findById(
      req.user!,
      getRouteParam(req, 'id'),
    )
    res.json(prestacao)
  }),
)
