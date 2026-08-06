import { Router } from 'express'
import { authRoutes } from './auth.routes.js'
import { entregaRoutes } from './entrega.routes.js'
import { pendenciaRoutes } from './pendencia.routes.js'
import { prestacaoRoutes } from './prestacao.routes.js'
import { reportRoutes } from './report.routes.js'
import { rotaRoutes } from './rota.routes.js'
import { requireAuth } from '../middleware/auth.middleware.js'

export const apiRoutes = Router()

apiRoutes.use('/auth', authRoutes)

apiRoutes.use(requireAuth)

apiRoutes.use('/entregas', entregaRoutes)
apiRoutes.use('/pendencias', pendenciaRoutes)
apiRoutes.use('/prestacoes', prestacaoRoutes)
apiRoutes.use('/reports', reportRoutes)
apiRoutes.use('/rotas', rotaRoutes)
