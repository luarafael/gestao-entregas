import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  asyncHandler,
  validateBody,
} from '../middleware/index.js'
import { loginSchema } from '../schemas/auth.schema.js'
import { authService } from '../services/auth.service.js'
import { requireAuth } from '../middleware/auth.middleware.js'

export const authRoutes = Router()

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
  },
})

authRoutes.post(
  '/login',
  loginRateLimit,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body)
    res.json(result)
  }),
)

authRoutes.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await authService.getMe(req.user!.id)
    res.json(user)
  }),
)
