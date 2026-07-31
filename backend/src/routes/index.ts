import { Router } from 'express'
import { entregaRoutes } from './entrega.routes.js'
import { pendenciaRoutes } from './pendencia.routes.js'
import { prestacaoRoutes } from './prestacao.routes.js'

export const apiRoutes = Router()

apiRoutes.use('/entregas', entregaRoutes)
apiRoutes.use('/pendencias', pendenciaRoutes)
apiRoutes.use('/prestacoes', prestacaoRoutes)
