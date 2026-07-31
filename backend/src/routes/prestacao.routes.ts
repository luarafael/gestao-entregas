import { Router } from 'express'
import {
  asyncHandler,
  getRouteParam,
  validateBody,
  validateQuery,
} from '../middleware/index.js'
import {
  generatePrestacaoSchema,
  listPrestacoesSchema,
  type ListPrestacoesInput,
} from '../schemas/prestacao.schema.js'
import { prestacaoService } from '../services/prestacao.service.js'

export const prestacaoRoutes = Router()

prestacaoRoutes.get(
  '/',
  validateQuery(listPrestacoesSchema),
  asyncHandler(async (req, res) => {
    const result = await prestacaoService.list(req.query as unknown as ListPrestacoesInput)
    res.json(result)
  }),
)

prestacaoRoutes.get(
  '/:id/whatsapp',
  asyncHandler(async (req, res) => {
    const text = await prestacaoService.getWhatsAppText(getRouteParam(req, 'id'))
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

prestacaoRoutes.post(
  '/generate',
  validateBody(generatePrestacaoSchema),
  asyncHandler(async (req, res) => {
    const result = await prestacaoService.generate(req.body)
    res.status(201).json(result)
  }),
)
