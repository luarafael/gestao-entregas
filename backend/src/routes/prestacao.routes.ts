import { Router } from 'express'
import {
  asyncHandler,
  getRouteParam,
  getValidatedQuery,
  validateBody,
  validateQuery,
} from '../middleware/index.js'
import {
  generatePrestacaoSchema,
  listPrestacoesSchema,
  previewPrestacaoQuerySchema,
  updatePrestacaoSchema,
  type ListPrestacoesInput,
  type PreviewPrestacaoQuery,
} from '../schemas/prestacao.schema.js'
import {
  listHistoricoPrestacaoSchema,
  prestacaoWhatsAppQuerySchema,
  type ListHistoricoPrestacaoInput,
  type PrestacaoWhatsAppQuery,
} from '../schemas/prestacao-cliente.schema.js'
import { prestacaoHistoricoService } from '../services/prestacao-historico.service.js'
import { prestacaoService } from '../services/prestacao.service.js'

export const prestacaoRoutes = Router()

prestacaoRoutes.get(
  '/historico',
  validateQuery(listHistoricoPrestacaoSchema),
  asyncHandler(async (req, res) => {
    const result = await prestacaoHistoricoService.list(
      getValidatedQuery<ListHistoricoPrestacaoInput>(req),
    )
    res.json(result)
  }),
)

prestacaoRoutes.get(
  '/',
  validateQuery(listPrestacoesSchema),
  asyncHandler(async (req, res) => {
    const result = await prestacaoService.list(getValidatedQuery<ListPrestacoesInput>(req))
    res.json(result)
  }),
)

prestacaoRoutes.get(
  '/preview',
  validateQuery(previewPrestacaoQuerySchema),
  asyncHandler(async (req, res) => {
    const query = getValidatedQuery<PreviewPrestacaoQuery>(req)
    const preview = await prestacaoService.preview(
      query.data ? { data: query.data } : undefined,
    )
    res.json(preview)
  }),
)

prestacaoRoutes.post(
  '/generate',
  validateBody(generatePrestacaoSchema),
  asyncHandler(async (req, res) => {
    const result = await prestacaoService.generate(req.body)
    res.status(201).json(result)
  }),
)

prestacaoRoutes.get(
  '/:id/whatsapp',
  validateQuery(prestacaoWhatsAppQuerySchema),
  asyncHandler(async (req, res) => {
    const query = getValidatedQuery<PrestacaoWhatsAppQuery>(req)
    const text = await prestacaoService.getWhatsAppText(
      getRouteParam(req, 'id'),
      query,
    )
    res.json({ text })
  }),
)

prestacaoRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const prestacao = await prestacaoService.findById(getRouteParam(req, 'id'))
    res.json(prestacao)
  }),
)

prestacaoRoutes.put(
  '/:id',
  validateBody(updatePrestacaoSchema),
  asyncHandler(async (req, res) => {
    const prestacao = await prestacaoService.update(getRouteParam(req, 'id'), req.body)
    res.json(prestacao)
  }),
)

prestacaoRoutes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prestacaoService.delete(getRouteParam(req, 'id'))
    res.status(204).send()
  }),
)
