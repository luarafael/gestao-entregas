import { Router } from 'express'
import { authRoutes } from './auth.routes.js'
import { entregaRoutes } from './entrega.routes.js'
import { pendenciaRoutes } from './pendencia.routes.js'
import { prestacaoMotoboyRoutes } from './prestacao-motoboy.routes.js'
import { prestacaoRoutes } from './prestacao.routes.js'
import { reportRoutes } from './report.routes.js'
import { rotaRoutes } from './rota.routes.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

export const apiRoutes = Router()

apiRoutes.use('/auth', authRoutes)

apiRoutes.use(requireAuth)

apiRoutes.use('/pendencias', pendenciaRoutes)
apiRoutes.use('/prestacoes', requireRole('ADMIN'), prestacaoRoutes)
apiRoutes.use('/prestacoes-motoboy', prestacaoMotoboyRoutes)
apiRoutes.use('/reports', requireRole('ADMIN'), reportRoutes)
apiRoutes.use('/entregas', entregaRoutes)
apiRoutes.use('/rotas', rotaRoutes)
