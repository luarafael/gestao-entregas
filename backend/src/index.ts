import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { errorHandler } from './middleware/index.js'
import { apiRoutes } from './routes/index.js'

const app = express()

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
)
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'API Sistema de Gestão de Entregas',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api', apiRoutes)

app.use(errorHandler)

if (env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`)
  })
}

export default app
