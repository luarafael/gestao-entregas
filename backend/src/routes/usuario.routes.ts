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
  createAdminSchema,
  createMotoboySchema,
  listAdminsSchema,
  listMotoboysSchema,
  setMotoboyAtivoSchema,
  updateAdminSchema,
  updateMotoboySchema,
  type ListAdminsInput,
  type ListMotoboysInput,
} from '../schemas/usuario.schema.js'
import { usuarioService } from '../services/usuario.service.js'

export const usuarioRoutes = Router()

usuarioRoutes.use(requireRole('ADMIN'))

usuarioRoutes.get(
  '/admins',
  validateQuery(listAdminsSchema),
  asyncHandler(async (req, res) => {
    const result = await usuarioService.listAdmins(
      req.user!.id,
      getValidatedQuery<ListAdminsInput>(req),
    )
    res.json(result)
  }),
)

usuarioRoutes.get(
  '/admins/:id',
  asyncHandler(async (req, res) => {
    const admin = await usuarioService.getAdminById(getRouteParam(req, 'id'))
    res.json(admin)
  }),
)

usuarioRoutes.post(
  '/admins',
  validateBody(createAdminSchema),
  asyncHandler(async (req, res) => {
    const admin = await usuarioService.createAdmin(req.body)
    res.status(201).json(admin)
  }),
)

usuarioRoutes.put(
  '/admins/:id',
  validateBody(updateAdminSchema),
  asyncHandler(async (req, res) => {
    const admin = await usuarioService.updateAdmin(
      getRouteParam(req, 'id'),
      req.body,
    )
    res.json(admin)
  }),
)

usuarioRoutes.patch(
  '/admins/:id/ativo',
  validateBody(setMotoboyAtivoSchema),
  asyncHandler(async (req, res) => {
    const admin = await usuarioService.setAdminAtivo(
      req.user!.id,
      getRouteParam(req, 'id'),
      req.body,
    )
    res.json(admin)
  }),
)

usuarioRoutes.delete(
  '/admins/:id',
  asyncHandler(async (req, res) => {
    await usuarioService.deleteAdmin(req.user!.id, getRouteParam(req, 'id'))
    res.status(204).send()
  }),
)

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

usuarioRoutes.delete(
  '/motoboys/:id',
  asyncHandler(async (req, res) => {
    await usuarioService.deleteMotoboy(getRouteParam(req, 'id'))
    res.status(204).send()
  }),
)
