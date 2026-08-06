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
  createMotoboySchema,
  listMotoboysSchema,
  setMotoboyAtivoSchema,
  updateMotoboySchema,
  type ListMotoboysInput,
} from '../schemas/usuario.schema.js'
import { usuarioService } from '../services/usuario.service.js'

export const usuarioRoutes = Router()

usuarioRoutes.use(requireRole('ADMIN'))

usuarioRoutes.get(
  '/motoboys',
  validateQuery(listMotoboysSchema),
  asyncHandler(async (req, res) => {
    const result = await usuarioService.listMotoboys(
      getValidatedQuery<ListMotoboysInput>(req),
    )
    res.json(result)
  }),
)

usuarioRoutes.get(
  '/motoboys/:id',
  asyncHandler(async (req, res) => {
    const motoboy = await usuarioService.getMotoboyById(getRouteParam(req, 'id'))
    res.json(motoboy)
  }),
)

usuarioRoutes.post(
  '/motoboys',
  validateBody(createMotoboySchema),
  asyncHandler(async (req, res) => {
    const motoboy = await usuarioService.createMotoboy(req.body)
    res.status(201).json(motoboy)
  }),
)

usuarioRoutes.put(
  '/motoboys/:id',
  validateBody(updateMotoboySchema),
  asyncHandler(async (req, res) => {
    const motoboy = await usuarioService.updateMotoboy(
      getRouteParam(req, 'id'),
      req.body,
    )
    res.json(motoboy)
  }),
)

usuarioRoutes.patch(
  '/motoboys/:id/ativo',
  validateBody(setMotoboyAtivoSchema),
  asyncHandler(async (req, res) => {
    const motoboy = await usuarioService.setMotoboyAtivo(
      getRouteParam(req, 'id'),
      req.body,
    )
    res.json(motoboy)
  }),
)
