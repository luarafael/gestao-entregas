import type { NextFunction, Request, Response } from 'express'
import { ZodError, type ZodType } from 'zod'
import { AppError } from '../errors/app.error.js'

export function getRouteParam(req: Request, param: string): string {
  const value = req.params[param]
  if (typeof value !== 'string') {
    throw new AppError(400, `Parâmetro inválido: ${param}`)
  }
  return value
}

export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body) as Request['body']
      next()
    } catch (error) {
      next(error)
    }
  }
}

export function validateQuery<T extends Record<string, unknown>>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.query)
      Object.assign(req.query, parsed)
      next()
    } catch (error) {
      next(error)
    }
  }
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Dados inválidos',
      details: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    })
    return
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.name,
      message: error.message,
    })
    return
  }

  console.error(error)
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Erro interno do servidor',
  })
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next)
  }
}
