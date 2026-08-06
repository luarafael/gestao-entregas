import type { Express } from 'express'

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: unknown
      user?: {
        id: string
        email: string
        role: 'ADMIN' | 'MOTOBOY'
        nome: string
      }
    }
  }
}

export type {}
