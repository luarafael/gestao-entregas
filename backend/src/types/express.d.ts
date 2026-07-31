import type { Express } from 'express'

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: unknown
    }
  }
}

export type {}
