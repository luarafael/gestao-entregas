import { Router } from 'express'
import {
  asyncHandler,
  getRouteParam,
  getValidatedQuery,
  validateBody,
  validateQuery,
} from '../middleware/index.js'
import {
  listClientesByDateQuerySchema,
  listPrestacoesClienteSchema,
  previewPrestacaoClienteQuerySchema,
  submitPrestacaoClienteSchema,
  type ListClientesByDateQuery,
  type ListPrestacoesClienteInput,
  type PreviewPrestacaoClienteQuery,
} from '../schemas/prestacao-cliente.schema.js'
import { prestacaoClienteService } from '../services/prestacao-cliente.service.js'

export const prestacaoClienteRoutes = Router()

prestacaoClienteRoutes.get(
  '/clientes',
  validateQuery(listClientesByDateQuerySchema),
  asyncHandler(async (req, res) => {
    const query = getValidatedQuery<ListClientesByDateQuery>(req)
    const result = await prestacaoClienteService.listClientesByDate(query)
    res.json(result)
  }),
)

prestacaoClienteRoutes.get(
  '/preview',
  validateQuery(previewPrestacaoClienteQuerySchema),
  asyncHandler(async (req, res) => {
    const query = getValidatedQuery<PreviewPrestacaoClienteQuery>(req)
    const preview = await prestacaoClienteService.preview({
      data: query.data,
      nomeCliente: query.nomeCliente,
    })
    res.json(preview)
  }),
)

prestacaoClienteRoutes.get(
  '/',
  validateQuery(listPrestacoesClienteSchema),
  asyncHandler(async (req, res) => {
    const result = await prestacaoClienteService.list(
      getValidatedQuery<ListPrestacoesClienteInput>(req),
    )
    res.json(result)
  }),
)

prestacaoClienteRoutes.post(
  '/',
  validateBody(submitPrestacaoClienteSchema),
  asyncHandler(async (req, res) => {
    const result = await prestacaoClienteService.submit(req.body)
    res.status(201).json(result)
  }),
)

prestacaoClienteRoutes.get(
  '/:id/whatsapp',
  asyncHandler(async (req, res) => {
    const text = await prestacaoClienteService.getWhatsAppText(
      getRouteParam(req, 'id'),
    )
    res.json({ text })
  }),
)

prestacaoClienteRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const prestacao = await prestacaoClienteService.findById(getRouteParam(req, 'id'))
    res.json(prestacao)
  }),
)

prestacaoClienteRoutes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prestacaoClienteService.delete(getRouteParam(req, 'id'))
    res.status(204).send()
  }),
)
