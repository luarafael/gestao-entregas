import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env.js'
import { errorHandler } from './middleware/index.js'
import { apiRoutes } from './routes/index.js'

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
)
app.use(express.json())

app.use((_req, res, next) => {
  const json = res.json.bind(res)
  res.json = (body: unknown) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return json(body)
  }
  next()
})

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
